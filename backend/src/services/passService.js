import mongoose from 'mongoose';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import { AppError } from '../middleware/errorHandler.js';
import { generatePassCode, generatePassToken } from '../utils/generatePassToken.js';
import { generateQRDataURL } from './qrGenerator.js';
import { createEventPassPDF } from './passGenerator.js';

/**
 * Derive the 6-state Pass Status requested for EventHub:
 * - Event Cancelled
 * - Cancelled
 * - Attended
 * - Checked In
 * - Missed/Expired
 * - Valid
 */
export function computeDisplayPassStatus(reg, event, now = new Date()) {
  if (!event) return 'Cancelled';

  if (event.status === 'cancelled') {
    return 'Event Cancelled';
  }

  if (reg.status === 'cancelled' || reg.passStatus === 'revoked') {
    return 'Cancelled';
  }

  const eventDate = event.date ? new Date(event.date) : null;
  const isEventCompleted =
    event.status === 'completed' || (eventDate && eventDate.getTime() < now.getTime());

  if (reg.attendanceStatus === 'present') {
    return isEventCompleted ? 'Attended' : 'Checked In';
  }

  if (isEventCompleted || reg.attendanceStatus === 'absent') {
    return 'Missed/Expired';
  }

  if (reg.status === 'confirmed' && reg.passStatus === 'active') {
    return 'Valid';
  }

  return reg.status === 'pending' ? 'Pending Confirmation' : 'Waitlisted';
}

function classifyPassTab(displayStatus, event, now = new Date()) {
  if (displayStatus === 'Attended' || displayStatus === 'Missed/Expired') {
    return 'past';
  }
  if (event?.status === 'completed') {
    return 'past';
  }
  if (event?.date && new Date(event.date).getTime() < now.getTime()) {
    return 'past';
  }
  return 'upcoming';
}

function normalizeTokenInput(rawInput) {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) return '';

  // Support optional JSON payload or prefix if scanned from external QR
  if (trimmed.startsWith('EVENTHUB:PASS:')) {
    return trimmed.slice('EVENTHUB:PASS:'.length).trim();
  }
  return trimmed;
}

function assertNotCertificateInput(value) {
  const upper = value.toUpperCase();
  if (upper.startsWith('EVH-') || upper.includes('/VERIFY/')) {
    throw new AppError(
      'This QR / ID belongs to a Certificate, not an Event Pass. Switch to the Certificate Verification mode.',
      400
    );
  }
}

async function ensureRegistrationPassToken(reg) {
  if (reg.status !== 'confirmed') return reg;
  if (reg.passToken && reg.passCode && reg.passStatus !== 'none') return reg;

  const updates = {};
  if (!reg.passToken) updates.passToken = generatePassToken();
  if (!reg.passCode) updates.passCode = generatePassCode();
  if (reg.passStatus === 'none') updates.passStatus = 'active';

  const updated = await Registration.findByIdAndUpdate(
    reg._id,
    { $set: updates },
    { new: true }
  )
    .populate('event', 'title description category date venue capacity status')
    .populate('student', 'fullName email studentId collegeName')
    .lean();

  return updated || { ...reg, ...updates };
}

async function formatPassRecord(rawReg, now = new Date()) {
  const reg = await ensureRegistrationPassToken(rawReg);
  const event = reg.event || null;
  const student = reg.student || null;
  const displayStatus = computeDisplayPassStatus(reg, event, now);
  const tab = classifyPassTab(displayStatus, event, now);

  const canCarryQR = Boolean(
    reg.passToken &&
      reg.status === 'confirmed' &&
      reg.passStatus !== 'revoked' &&
      event?.status !== 'cancelled'
  );
  const qrCode = canCarryQR ? await generateQRDataURL(reg.passToken) : null;

  return {
    id: reg._id.toString(),
    registrationId: reg._id.toString(),
    registrationCode: reg.passCode || reg._id.toString().slice(-8).toUpperCase(),
    passToken: reg.passToken || null,
    passStatus: reg.passStatus,
    registrationStatus: reg.status,
    attendanceStatus: reg.attendanceStatus,
    checkedInAt: reg.checkedInAt || null,
    registeredAt: reg.registeredAt || reg.createdAt,
    displayStatus,
    tab,
    qrCode,
    event: event
      ? {
          id: event._id.toString(),
          title: event.title,
          description: event.description || '',
          category: event.category || 'General',
          date: event.date,
          venue: event.venue || 'Campus Venue',
          status: event.status,
        }
      : null,
    student: student
      ? {
          id: student._id.toString(),
          fullName: student.fullName,
          studentId: student.studentId,
          collegeName: student.collegeName,
        }
      : null,
  };
}

/**
 * Student: Fetch all event passes (upcoming + past) for the authenticated student.
 */
export async function listStudentPasses(studentId) {
  const now = new Date();
  const registrations = await Registration.find({ student: studentId })
    .populate('event', 'title description category date venue capacity status')
    .populate('student', 'fullName email studentId collegeName')
    .sort({ registeredAt: -1, createdAt: -1 })
    .lean();

  const passes = await Promise.all(
    registrations.filter((r) => r.event).map((r) => formatPassRecord(r, now))
  );

  // Sort upcoming ascending by event date, past descending
  const upcoming = passes
    .filter((p) => p.tab === 'upcoming')
    .sort((a, b) => new Date(a.event?.date || 0) - new Date(b.event?.date || 0));

  const past = passes
    .filter((p) => p.tab === 'past')
    .sort((a, b) => new Date(b.event?.date || 0) - new Date(a.event?.date || 0));

  return {
    passes: [...upcoming, ...past],
    upcoming,
    past,
    counts: {
      total: passes.length,
      upcoming: upcoming.length,
      past: past.length,
      valid: passes.filter((p) => p.displayStatus === 'Valid').length,
      checkedIn: passes.filter((p) => p.displayStatus === 'Checked In').length,
      attended: passes.filter((p) => p.displayStatus === 'Attended').length,
    },
  };
}

/**
 * Student: Fetch all event registrations for the authenticated student.
 */
export async function listStudentRegistrations(studentId) {
  const now = new Date();
  const registrations = await Registration.find({ student: studentId })
    .populate('event', 'title description category date venue capacity status')
    .sort({ registeredAt: -1, createdAt: -1 })
    .lean();

  return registrations
    .filter((r) => r.event)
    .map((r) => ({
      id: r._id.toString(),
      registrationCode: r.passCode || r._id.toString().slice(-8).toUpperCase(),
      status: r.status,
      passStatus: r.passStatus,
      attendanceStatus: r.attendanceStatus,
      displayStatus: computeDisplayPassStatus(r, r.event, now),
      checkedInAt: r.checkedInAt || null,
      registeredAt: r.registeredAt || r.createdAt,
      event: {
        id: r.event._id.toString(),
        title: r.event.title,
        description: r.event.description || '',
        category: r.event.category || 'General',
        date: r.event.date,
        venue: r.event.venue || 'Campus Venue',
        status: r.event.status,
      },
    }));
}

/**
 * Student: Generate downloadable PDF for a specific registration pass owned by studentId.
 */
export async function buildStudentPassPDF(registrationId, studentId) {
  if (!mongoose.isValidObjectId(registrationId)) {
    throw new AppError('Invalid pass registration ID', 400);
  }

  const rawReg = await Registration.findOne({ _id: registrationId, student: studentId })
    .populate('event', 'title description category date venue status')
    .populate('student', 'fullName studentId collegeName')
    .lean();

  if (!rawReg || !rawReg.event) {
    throw new AppError('Event pass not found', 404);
  }

  if (rawReg.status !== 'confirmed') {
    throw new AppError(
      `Pass download is unavailable while registration status is "${rawReg.status}".`,
      400
    );
  }

  if (rawReg.passStatus === 'revoked' || rawReg.event.status === 'cancelled') {
    throw new AppError(
      'This event pass has been revoked or cancelled and cannot be downloaded.',
      400
    );
  }

  const formatted = await formatPassRecord(rawReg);
  if (!formatted.passToken) {
    throw new AppError('QR pass token is not available for this registration', 400);
  }

  const doc = await createEventPassPDF({
    registrationId: formatted.registrationId,
    registrationCode: formatted.registrationCode,
    passToken: formatted.passToken,
    displayStatus: formatted.displayStatus,
    eventTitle: formatted.event.title,
    eventCategory: formatted.event.category,
    eventDate: formatted.event.date,
    eventVenue: formatted.event.venue,
    studentName: formatted.student?.fullName || 'Student',
    studentIdNumber: formatted.student?.studentId || '—',
    collegeName: formatted.student?.collegeName || 'Campus',
  });

  return {
    filename: `EventHub_Pass_${formatted.registrationCode}.pdf`,
    doc,
  };
}

async function lookupRegistrationByTokenOrCode(tokenOrCode) {
  const token = normalizeTokenInput(tokenOrCode);
  if (!token) {
    throw new AppError('Please scan a QR code or enter a pass token / pass code.', 400);
  }

  assertNotCertificateInput(token);

  // Primary lookup by opaque passToken; secondary fallback by passCode for manual desk entry
  let reg = await Registration.findOne({ passToken: token })
    .populate('event', 'title category date venue status')
    .populate('student', 'fullName email studentId collegeName')
    .lean();

  if (!reg) {
    reg = await Registration.findOne({ passCode: token.toUpperCase() })
      .populate('event', 'title category date venue status')
      .populate('student', 'fullName email studentId collegeName')
      .lean();
  }

  if (!reg || !reg.event || !reg.student) {
    throw new AppError('Invalid pass: no matching registration found.', 404);
  }

  return reg;
}

function validatePassEligibility(reg, selectedEventId) {
  if (selectedEventId && reg.event._id.toString() !== selectedEventId) {
    throw new AppError(
      `Event mismatch: this pass belongs to "${reg.event.title}", not the selected event.`,
      400
    );
  }

  if (reg.event.status === 'cancelled') {
    throw new AppError('Event cancelled: check-in is disabled for cancelled events.', 400);
  }

  if (reg.event.status === 'completed') {
    throw new AppError('Event completed: check-in window for this event has closed.', 400);
  }

  if (reg.event.date && new Date(reg.event.date).getTime() < Date.now()) {
    throw new AppError(
      'Event expired: check-in is closed because this event has already ended.',
      400
    );
  }

  if (reg.event.status === 'draft') {
    throw new AppError('Event is still in draft mode and not open for check-in.', 400);
  }

  if (reg.status === 'cancelled' || reg.passStatus === 'revoked') {
    throw new AppError('Registration cancelled: this pass has been revoked.', 400);
  }

  if (reg.status !== 'confirmed') {
    throw new AppError(
      `Pass ineligible: registration status is "${reg.status}" (must be confirmed).`,
      400
    );
  }

  if (reg.attendanceStatus === 'present' || reg.passStatus === 'used') {
    const when = reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : 'earlier';
    throw new AppError(
      `Duplicate check-in blocked: ${reg.student.fullName} was already checked in (${when}).`,
      409
    );
  }

  if (reg.passStatus !== 'active') {
    throw new AppError(`Pass is not active (current state: ${reg.passStatus}).`, 400);
  }
}

/**
 * Admin: Verify a student's pass token/code without mutating attendance (dry-run inspection).
 */
export async function verifyEventPass({ token, eventId }) {
  const reg = await lookupRegistrationByTokenOrCode(token);
  const displayStatus = computeDisplayPassStatus(reg, reg.event);

  let eligible = false;
  let eligibilityMessage = 'Pass is valid and ready for check-in.';
  let conflict = false;

  try {
    validatePassEligibility(reg, eventId);
    eligible = true;
  } catch (err) {
    eligible = false;
    eligibilityMessage = err.message;
    conflict = err.statusCode === 409;
  }

  return {
    verificationType: 'event_pass',
    eligible,
    conflict,
    message: eligibilityMessage,
    pass: {
      registrationId: reg._id.toString(),
      registrationCode: reg.passCode || reg._id.toString().slice(-8).toUpperCase(),
      displayStatus,
      passStatus: reg.passStatus,
      registrationStatus: reg.status,
      attendanceStatus: reg.attendanceStatus,
      checkedInAt: reg.checkedInAt,
    },
    student: {
      id: reg.student._id.toString(),
      fullName: reg.student.fullName,
      email: reg.student.email,
      studentId: reg.student.studentId,
      collegeName: reg.student.collegeName,
    },
    event: {
      id: reg.event._id.toString(),
      title: reg.event.title,
      category: reg.event.category,
      date: reg.event.date,
      venue: reg.event.venue,
      status: reg.event.status,
    },
  };
}

/**
 * Admin: Verify pass and atomically mark attendance, preventing duplicate check-ins at DB level.
 */
export async function checkInEventPass({ token, eventId }, adminUserId) {
  const reg = await lookupRegistrationByTokenOrCode(token);
  validatePassEligibility(reg, eventId);

  const now = new Date();
  const updated = await Registration.findOneAndUpdate(
    {
      _id: reg._id,
      status: 'confirmed',
      passStatus: 'active',
      attendanceStatus: 'not_marked',
      checkedInAt: null,
    },
    {
      $set: {
        attendanceStatus: 'present',
        passStatus: 'used',
        checkedInAt: now,
        checkedInBy: adminUserId,
      },
    },
    { new: true }
  )
    .populate('event', 'title category date venue status')
    .populate('student', 'fullName email studentId collegeName')
    .lean();

  if (!updated) {
    throw new AppError(
      'Duplicate check-in blocked: this pass has already been used or modified.',
      409
    );
  }

  const displayStatus = computeDisplayPassStatus(updated, updated.event, now);

  return {
    verificationType: 'event_pass',
    checkedIn: true,
    message: `Checked in ${updated.student.fullName} for ${updated.event.title}.`,
    pass: {
      registrationId: updated._id.toString(),
      registrationCode: updated.passCode || updated._id.toString().slice(-8).toUpperCase(),
      displayStatus,
      passStatus: updated.passStatus,
      attendanceStatus: updated.attendanceStatus,
      checkedInAt: updated.checkedInAt,
    },
    student: {
      id: updated.student._id.toString(),
      fullName: updated.student.fullName,
      email: updated.student.email,
      studentId: updated.student.studentId,
      collegeName: updated.student.collegeName,
    },
    event: {
      id: updated.event._id.toString(),
      title: updated.event.title,
      category: updated.event.category,
      date: updated.event.date,
      venue: updated.event.venue,
      status: updated.event.status,
    },
  };
}

/**
 * Admin: Fetch events + recent check-in logs for the Attendance / Verify QR/ID desk.
 */
export async function getAdminAttendanceOverview(eventId = '') {
  const eventFilter = {};
  const regFilter = { status: { $ne: 'cancelled' } };
  if (eventId && eventId !== 'all' && mongoose.isValidObjectId(eventId)) {
    regFilter.event = eventId;
  }

  const [events, registrations] = await Promise.all([
    Event.find(eventFilter).sort({ date: -1 }).select('title category date venue status').lean(),
    Registration.find(regFilter)
      .sort({ checkedInAt: -1, updatedAt: -1 })
      .limit(100)
      .populate('student', 'fullName email studentId collegeName')
      .populate('event', 'title category date venue status')
      .populate('checkedInBy', 'fullName')
      .lean(),
  ]);

  const now = new Date();
  const records = registrations
    .filter((r) => r.event && r.student)
    .map((r) => ({
      registrationId: r._id.toString(),
      registrationCode: r.passCode || r._id.toString().slice(-8).toUpperCase(),
      studentName: r.student.fullName,
      studentId: r.student.studentId,
      collegeName: r.student.collegeName,
      eventId: r.event._id.toString(),
      eventTitle: r.event.title,
      eventDate: r.event.date,
      registrationStatus: r.status,
      passStatus: r.passStatus,
      attendanceStatus: r.attendanceStatus,
      displayStatus: computeDisplayPassStatus(r, r.event, now),
      checkedInAt: r.checkedInAt,
      checkedInByName: r.checkedInBy?.fullName || null,
    }));

  return {
    events: events.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      category: e.category,
      date: e.date,
      venue: e.venue,
      status: e.status,
    })),
    records,
    summary: {
      total: records.length,
      checkedIn: records.filter((r) => r.attendanceStatus === 'present').length,
      pendingCheckIn: records.filter(
        (r) => r.registrationStatus === 'confirmed' && r.attendanceStatus === 'not_marked'
      ).length,
    },
  };
}
