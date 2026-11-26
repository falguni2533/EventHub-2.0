import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

const toDateKey = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatShortDate = (value) => {
  if (!value) return 'TBA';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'TBA';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getWeekStartKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diffToMonday);
  return toDateKey(copy);
};

const normalizeAttendanceStatus = (reg) =>
  reg.attendanceStatus === 'present' ? 'Present' : 'Absent';

const formatAttendanceRecord = (reg) => {
  const status = normalizeAttendanceStatus(reg);
  const eventDate = reg.event?.date || reg.createdAt;
  return {
    registrationId: reg._id.toString(),
    registrationCode: reg.passCode || reg._id.toString().slice(-8).toUpperCase(),
    studentRef: reg.student?._id?.toString() || '',
    studentName: reg.student?.fullName || 'Student',
    studentId: reg.student?.studentId || '—',
    studentEmail: reg.student?.email || '',
    collegeName: reg.student?.collegeName || '—',
    eventId: reg.event?._id?.toString() || '',
    eventTitle: reg.event?.title || 'Campus Event',
    eventCategory: reg.event?.category || 'General',
    eventDate,
    eventDateKey: toDateKey(eventDate),
    eventVenue: reg.event?.venue || 'Campus Venue',
    checkInTime: reg.checkedInAt || null,
    checkInDateKey: toDateKey(reg.checkedInAt),
    checkedInByName: reg.checkedInBy?.fullName || null,
    attendanceStatus: status,
    rawAttendanceStatus: reg.attendanceStatus,
    registrationStatus: reg.status,
  };
};

const filterRecords = (records, { eventId, date, status, search } = {}, isStudent = false) => {
  const cleanSearch = String(search || '').trim().toLowerCase();
  const cleanStatus = String(status || 'all').trim().toLowerCase();
  const cleanDate = String(date || '').trim();
  const cleanEventId = String(eventId || 'all').trim();

  return records.filter((rec) => {
    if (cleanEventId && cleanEventId !== 'all' && rec.eventId !== cleanEventId) {
      return false;
    }

    if (cleanStatus && cleanStatus !== 'all' && rec.attendanceStatus.toLowerCase() !== cleanStatus) {
      return false;
    }

    if (cleanDate) {
      if (rec.eventDateKey !== cleanDate && rec.checkInDateKey !== cleanDate) {
        return false;
      }
    }

    if (cleanSearch) {
      const fields = isStudent
        ? [rec.eventTitle, rec.eventCategory, rec.eventVenue]
        : [rec.studentName, rec.studentId, rec.collegeName, rec.eventTitle];
      const matches = fields.some((f) => String(f || '').toLowerCase().includes(cleanSearch));
      if (!matches) return false;
    }

    return true;
  });
};

const buildAdminCharts = (records) => {
  // 1. Attendance Overview - chronological trend by date
  const byDate = new Map();
  for (const rec of records) {
    const key = rec.checkInDateKey || rec.eventDateKey;
    if (!key) continue;
    if (!byDate.has(key)) {
      byDate.set(key, {
        dateKey: key,
        label: formatShortDate(`${key}T00:00:00`),
        present: 0,
        absent: 0,
      });
    }
    const bucket = byDate.get(key);
    if (rec.attendanceStatus === 'Present') bucket.present += 1;
    else bucket.absent += 1;
  }

  const attendanceTrend = Array.from(byDate.values())
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .map((b) => {
      const total = b.present + b.absent;
      return {
        ...b,
        total,
        rate: total > 0 ? Math.round((b.present / total) * 100) : 0,
      };
    });

  // 2. Present vs Absent
  const presentCount = records.filter((r) => r.attendanceStatus === 'Present').length;
  const absentCount = records.length - presentCount;

  // 3. Event-wise Attendance
  const byEvent = new Map();
  for (const rec of records) {
    if (!byEvent.has(rec.eventId)) {
      byEvent.set(rec.eventId, {
        eventId: rec.eventId,
        eventTitle: rec.eventTitle,
        present: 0,
        absent: 0,
      });
    }
    const bucket = byEvent.get(rec.eventId);
    if (rec.attendanceStatus === 'Present') bucket.present += 1;
    else bucket.absent += 1;
  }

  const eventWiseAttendance = Array.from(byEvent.values()).map((b) => {
    const total = b.present + b.absent;
    return {
      ...b,
      total,
      rate: total > 0 ? Math.round((b.present / total) * 100) : 0,
    };
  });

  // 4. Weekly Attendance Trends
  const byWeek = new Map();
  for (const rec of records) {
    const sourceDate = rec.checkInTime || rec.eventDate;
    const weekKey = getWeekStartKey(sourceDate);
    if (!weekKey) continue;
    if (!byWeek.has(weekKey)) {
      byWeek.set(weekKey, {
        weekKey,
        label: `Wk ${formatShortDate(`${weekKey}T00:00:00`)}`,
        present: 0,
        absent: 0,
      });
    }
    const bucket = byWeek.get(weekKey);
    if (rec.attendanceStatus === 'Present') bucket.present += 1;
    else bucket.absent += 1;
  }

  const weeklyTrends = Array.from(byWeek.values())
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey))
    .map((b) => {
      const total = b.present + b.absent;
      return {
        ...b,
        total,
        rate: total > 0 ? Math.round((b.present / total) * 100) : 0,
      };
    });

  return {
    attendanceTrend,
    presentVsAbsent: { present: presentCount, absent: absentCount },
    eventWiseAttendance,
    weeklyTrends,
  };
};

const buildStudentCharts = (records) => {
  // Chronological order for personal line & bar charts
  const chronological = [...records].sort(
    (a, b) => new Date(a.eventDate || 0) - new Date(b.eventDate || 0)
  );

  let runningAttended = 0;
  const personalTrend = chronological.map((rec, idx) => {
    const attended = rec.attendanceStatus === 'Present' ? 1 : 0;
    runningAttended += attended;
    return {
      eventId: rec.eventId,
      eventTitle: rec.eventTitle,
      label: formatShortDate(rec.eventDate),
      attended,
      missed: attended ? 0 : 1,
      cumulativeRate: Math.round((runningAttended / (idx + 1)) * 100),
    };
  });

  const presentCount = records.filter((r) => r.attendanceStatus === 'Present').length;
  const absentCount = records.length - presentCount;

  const eventWiseAttendance = chronological.map((rec) => ({
    eventId: rec.eventId,
    eventTitle: rec.eventTitle,
    attended: rec.attendanceStatus === 'Present' ? 1 : 0,
    missed: rec.attendanceStatus === 'Present' ? 0 : 1,
    rate: rec.attendanceStatus === 'Present' ? 100 : 0,
  }));

  return {
    personalTrend,
    presentVsAbsent: { present: presentCount, absent: absentCount },
    eventWiseAttendance,
  };
};

/**
 * Admin: Full MongoDB-backed attendance metrics, charts, and searchable records.
 */
export const getAdminAttendanceDashboard = async (filters = {}) => {
  const [events, registrations] = await Promise.all([
    Event.find({}).sort({ date: -1 }).select('title category date venue status').lean(),
    Registration.find({ status: { $ne: 'cancelled' } })
      .sort({ checkedInAt: -1, updatedAt: -1, createdAt: -1 })
      .populate('student', 'fullName email studentId collegeName')
      .populate('event', 'title category date venue status')
      .populate('checkedInBy', 'fullName')
      .lean(),
  ]);

  const allRecords = registrations
    .filter((r) => r.event && r.student)
    .map(formatAttendanceRecord);

  const filteredRecords = filterRecords(allRecords, filters, false);

  const uniqueStudents = new Set(
    filteredRecords.map((r) => r.studentRef).filter(Boolean)
  ).size;
  const presentStudents = filteredRecords.filter((r) => r.attendanceStatus === 'Present').length;
  const absentStudents = filteredRecords.length - presentStudents;
  const attendancePercentage =
    filteredRecords.length > 0
      ? Math.round((presentStudents / filteredRecords.length) * 100)
      : 0;

  return {
    events: events.map((ev) => ({
      id: ev._id.toString(),
      title: ev.title,
      category: ev.category,
      date: ev.date,
      dateKey: toDateKey(ev.date),
      venue: ev.venue,
      status: ev.status,
    })),
    summary: {
      totalStudents: uniqueStudents,
      totalRecords: filteredRecords.length,
      presentStudents,
      absentStudents,
      attendancePercentage,
    },
    charts: buildAdminCharts(filteredRecords),
    records: filteredRecords,
  };
};

/**
 * Student: Personal attendance metrics, charts, and history strictly scoped to studentId.
 */
export const getStudentAttendanceDashboard = async (studentId, filters = {}) => {
  if (!mongoose.isValidObjectId(studentId)) {
    return {
      events: [],
      summary: {
        totalRegistered: 0,
        eventsAttended: 0,
        eventsMissed: 0,
        attendancePercentage: 0,
      },
      charts: {
        personalTrend: [],
        presentVsAbsent: { present: 0, absent: 0 },
        eventWiseAttendance: [],
      },
      records: [],
    };
  }

  const registrations = await Registration.find({
    student: studentId,
    status: { $ne: 'cancelled' },
  })
    .sort({ checkedInAt: -1, createdAt: -1 })
    .populate('student', 'fullName email studentId collegeName')
    .populate('event', 'title category date venue status')
    .lean();

  const allPersonalRecords = registrations
    .filter((r) => r.event)
    .map(formatAttendanceRecord)
    .sort((a, b) => new Date(b.eventDate || 0) - new Date(a.eventDate || 0));

  const registeredEventsMap = new Map();
  for (const rec of allPersonalRecords) {
    if (!registeredEventsMap.has(rec.eventId)) {
      registeredEventsMap.set(rec.eventId, {
        id: rec.eventId,
        title: rec.eventTitle,
        date: rec.eventDate,
        dateKey: rec.eventDateKey,
      });
    }
  }

  const filteredRecords = filterRecords(allPersonalRecords, filters, true);
  const totalRegistered = filteredRecords.length;
  const eventsAttended = filteredRecords.filter((r) => r.attendanceStatus === 'Present').length;
  const eventsMissed = totalRegistered - eventsAttended;
  const attendancePercentage =
    totalRegistered > 0 ? Math.round((eventsAttended / totalRegistered) * 100) : 0;

  return {
    events: Array.from(registeredEventsMap.values()),
    summary: {
      totalRegistered,
      eventsAttended,
      eventsMissed,
      attendancePercentage,
    },
    charts: buildStudentCharts(filteredRecords),
    records: filteredRecords,
  };
};
