import User from '../models/User.js';
import AppEvent from '../models/Event.js';
import Registration from '../models/Registration.js';

const STUDENT_SECTIONS = [
  'Dashboard',
  'Explore Events',
  'My Registrations',
  'My Passes',
  'Attendance',
  'My Team',
  'My Profile',
];

const ADMIN_CAPABILITIES = [
  'Manage Events (Upcoming Phase)',
  'View Student Registrations (Upcoming Phase)',
  'Manage Attendance (Upcoming Phase)',
  'Administrative Controls',
];

/**
 * Fetches live MongoDB dashboard metrics, upcoming events, and activity scoped to the student.
 */
export const getStudentDashboardData = async (user) => {
  const now = new Date();
  const studentId = user.id;

  const [
    upcomingEvents,
    upcomingEventsCount,
    myRegistrationsCount,
    myPassesCount,
    attendedCount,
    totalMarkedCount,
    recentRegistrations,
  ] = await Promise.all([
    AppEvent.find({ status: 'published', date: { $gte: now } })
      .sort({ date: 1 })
      .limit(4)
      .select('title description category date venue capacity status')
      .lean(),
    AppEvent.countDocuments({ status: 'published', date: { $gte: now } }),
    Registration.countDocuments({
      student: studentId,
      status: { $ne: 'cancelled' },
    }),
    Registration.countDocuments({
      student: studentId,
      status: 'confirmed',
      passStatus: { $in: ['active', 'used'] },
    }),
    Registration.countDocuments({
      student: studentId,
      attendanceStatus: 'present',
    }),
    Registration.countDocuments({
      student: studentId,
      attendanceStatus: { $in: ['present', 'absent'] },
    }),
    Registration.find({ student: studentId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('event', 'title category date venue')
      .lean(),
  ]);

  const formattedUpcomingEvents = upcomingEvents.map((ev) => ({
    id: ev._id.toString(),
    title: ev.title,
    description: ev.description,
    category: ev.category,
    date: ev.date,
    venue: ev.venue,
    capacity: ev.capacity,
    status: ev.status,
  }));

  const recentActivity = recentRegistrations.map((reg) => {
    const eventTitle = reg.event?.title || 'Campus Event';
    if (reg.attendanceStatus === 'present' && reg.checkedInAt) {
      return {
        id: `${reg._id.toString()}-checkin`,
        type: 'attendance',
        title: `Checked in to ${eventTitle}`,
        detail: reg.event?.venue || 'Attendance verified',
        timestamp: reg.checkedInAt,
        status: 'present',
      };
    }

    if (reg.passStatus === 'active' && reg.passCode) {
      return {
        id: `${reg._id.toString()}-pass`,
        type: 'pass',
        title: `Entry pass issued for ${eventTitle}`,
        detail: `Status: ${reg.status}`,
        timestamp: reg.updatedAt || reg.registeredAt,
        status: reg.status,
      };
    }

    return {
      id: reg._id.toString(),
      type: 'registration',
      title: `Registered for ${eventTitle}`,
      detail: `Registration status: ${reg.status}`,
      timestamp: reg.registeredAt || reg.createdAt,
      status: reg.status,
    };
  });

  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const notifications = recentRegistrations
    .filter(
      (reg) =>
        reg.status === 'confirmed' &&
        reg.event?.date &&
        new Date(reg.event.date) >= now &&
        new Date(reg.event.date) <= sevenDaysAhead
    )
    .map((reg) => ({
      id: `upcoming-${reg._id.toString()}`,
      title: `Upcoming event: ${reg.event.title}`,
      detail: `Scheduled at ${reg.event.venue || 'Campus'}`,
      timestamp: reg.event.date,
    }));

  const attendanceRate =
    totalMarkedCount > 0 ? Math.round((attendedCount / totalMarkedCount) * 100) : null;

  return {
    panel: 'student',
    user,
    allowedSections: STUDENT_SECTIONS,
    stats: {
      upcomingEvents: upcomingEventsCount,
      myRegistrations: myRegistrationsCount,
      myPasses: myPassesCount,
      attendance: {
        attended: attendedCount,
        totalMarked: totalMarkedCount,
        rate: attendanceRate,
      },
    },
    upcomingEvents: formattedUpcomingEvents,
    recentActivity,
    notifications,
  };
};

/**
 * Fetches live MongoDB overview metrics, registrations, and administrative activity for admins.
 */
export const getAdminDashboardData = async (user) => {
  const now = new Date();

  const [
    totalStudents,
    totalEvents,
    upcomingEventsCount,
    totalRegistrations,
    pendingRegistrationsCount,
    presentCount,
    absentCount,
    recentRegistrationsRaw,
    recentEvents,
    recentStudents,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Event.countDocuments({}),
    Event.countDocuments({ status: 'published', date: { $gte: now } }),
    Registration.countDocuments({ status: { $ne: 'cancelled' } }),
    Registration.countDocuments({ status: 'pending' }),
    Registration.countDocuments({ attendanceStatus: 'present' }),
    Registration.countDocuments({ attendanceStatus: 'absent' }),
    Registration.find({})
      .sort({ registeredAt: -1, createdAt: -1 })
      .limit(6)
      .populate('student', 'fullName collegeName studentId')
      .populate('event', 'title category date')
      .lean(),
    Event.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title category date status createdAt')
      .lean(),
    User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(4)
      .select('fullName collegeName studentId createdAt')
      .lean(),
  ]);

  const recentRegistrations = recentRegistrationsRaw.map((reg) => ({
    id: reg._id.toString(),
    studentName: reg.student?.fullName || 'Student',
    studentId: reg.student?.studentId || '—',
    collegeName: reg.student?.collegeName || '—',
    eventName: reg.event?.title || 'Event',
    eventCategory: reg.event?.category || 'General',
    registeredAt: reg.registeredAt || reg.createdAt,
    status: reg.status,
    attendanceStatus: reg.attendanceStatus,
  }));

  const activityItems = [
    ...recentRegistrationsRaw.slice(0, 3).map((reg) => ({
      id: `reg-${reg._id.toString()}`,
      type: 'registration',
      title: `${reg.student?.fullName || 'A student'} registered for ${reg.event?.title || 'an event'}`,
      detail: `Status: ${reg.status}`,
      timestamp: reg.registeredAt || reg.createdAt,
    })),
    ...recentEvents.map((ev) => ({
      id: `event-${ev._id.toString()}`,
      type: 'event',
      title: `Event created: ${ev.title}`,
      detail: `${ev.category} • ${ev.status}`,
      timestamp: ev.createdAt,
    })),
    ...recentStudents.map((stu) => ({
      id: `student-${stu._id.toString()}`,
      type: 'student',
      title: `Student joined: ${stu.fullName}`,
      detail: `${stu.collegeName} (${stu.studentId})`,
      timestamp: stu.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 6);

  const notifications = [];
  if (pendingRegistrationsCount > 0) {
    notifications.push({
      id: 'pending-registrations',
      title: `${pendingRegistrationsCount} pending registration${pendingRegistrationsCount === 1 ? '' : 's'}`,
      detail: 'Awaiting administrative review once registration management is active.',
      timestamp: now.toISOString(),
    });
  }

  const totalMarked = presentCount + absentCount;
  const attendanceRate =
    totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : null;

  return {
    panel: 'admin',
    user,
    capabilities: ADMIN_CAPABILITIES,
    stats: {
      totalStudents,
      totalEvents,
      upcomingEvents: upcomingEventsCount,
      totalRegistrations,
      attendanceOverview: {
        present: presentCount,
        absent: absentCount,
        totalMarked,
        rate: attendanceRate,
      },
    },
    recentRegistrations,
    recentActivity: activityItems,
    notifications,
  };
};
