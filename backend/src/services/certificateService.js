import mongoose from 'mongoose';
import Certificate from '../models/Certificate.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateCertificateId } from '../utils/generateCertificateId.js';
import { generateQRDataURL } from './qrGenerator.js';
import { createCertificatePDF } from './certificateGenerator.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatEventDateLabel = (dateVal) => {
  if (!dateVal) return 'Completed';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Resolve the public frontend base URL for QR verification links.
 * Reused from standalone certificateController.js.
 */
export function resolveClientUrl(req) {
  const configured = process.env.CLIENT_URL;
  if (configured && !/localhost|127\.0\.0\.1/i.test(configured)) {
    return configured.replace(/\/$/, '');
  }

  const origin = req?.get?.('origin');
  if (origin) {
    return origin.replace(/\/$/, '');
  }

  const referer = req?.get?.('referer');
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // Ignore malformed referer header
    }
  }

  const forwardedHost = req?.get?.('x-forwarded-host');
  if (forwardedHost) {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
    return `${proto}://${forwardedHost}`.replace(/\/$/, '');
  }

  if (req?.hostname && req.hostname !== 'localhost' && req.hostname !== '127.0.0.1') {
    return `${req.protocol || 'http'}://${req.hostname}:5173`;
  }

  return (configured || 'http://localhost:5173').replace(/\/$/, '');
}

async function attachQRCode(cert, clientUrl) {
  if (!cert) return cert;
  const plain = typeof cert.toObject === 'function' ? cert.toObject() : { ...cert };
  const verifyUrl = `${clientUrl.replace(/\/$/, '')}/verify/${plain.certificateId}`;
  const qrCode = await generateQRDataURL(verifyUrl);
  return {
    ...plain,
    id: plain._id?.toString(),
    verifyUrl,
    qrCode,
  };
}

async function attachQRCodes(certs, clientUrl) {
  return Promise.all(certs.map((cert) => attachQRCode(cert, clientUrl)));
}

async function findCertificateByCode(certificateId) {
  const trimmedId = String(certificateId || '').trim();
  if (!trimmedId) return null;
  return Certificate.findOne({
    certificateId: new RegExp(`^${escapeRegex(trimmedId)}$`, 'i'),
  });
}

async function createUniqueCertificateRecord(payload) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const certificateId = generateCertificateId();
    try {
      return await Certificate.create({
        ...payload,
        certificateId,
      });
    } catch (err) {
      if (err?.code === 11000 && err?.keyPattern?.certificateId) {
        continue;
      }
      throw err;
    }
  }
  throw new AppError('Could not allocate a unique certificate ID', 500);
}

/**
 * Fetch certificates belonging to the authenticated student (req.user.id).
 */
export async function listStudentCertificates(studentId, clientUrl) {
  const certs = await Certificate.find({ student: studentId })
    .sort({ createdAt: -1 })
    .lean();
  return attachQRCodes(certs, clientUrl);
}

/**
 * Fetch a single certificate belonging to the authenticated student.
 */
export async function getStudentCertificateById(certificateId, studentId, clientUrl) {
  const trimmedId = String(certificateId || '').trim();
  if (!trimmedId) {
    throw new AppError('Certificate ID is required', 400);
  }

  const cert = await Certificate.findOne({
    student: studentId,
    certificateId: new RegExp(`^${escapeRegex(trimmedId)}$`, 'i'),
  }).lean();

  if (!cert) {
    throw new AppError('Certificate not found', 404);
  }

  return attachQRCode(cert, clientUrl);
}

/**
 * Admin: Fetch all certificates with optional status, eventId, and search filtering.
 */
export async function listAllCertificates({ status, eventId, search }, clientUrl) {
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (eventId && eventId !== 'all' && mongoose.isValidObjectId(eventId)) {
    filter.event = eventId;
  }

  let certs = await Certificate.find(filter)
    .populate('issuedBy', 'fullName')
    .populate('revokedBy', 'fullName')
    .sort({ createdAt: -1 })
    .lean();

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    certs = certs.filter(
      (c) =>
        c.participantName.toLowerCase().includes(q) ||
        c.eventName.toLowerCase().includes(q) ||
        c.certificateId.toLowerCase().includes(q)
    );
  }

  return attachQRCodes(certs, clientUrl);
}

/**
 * Public sanitized verification lookup by certificate ID.
 * Omits private fields (email, studentId, internal user ObjectIds).
 */
export async function verifyCertificatePublic(certificateId, clientUrl) {
  const trimmedId = String(certificateId || '').trim();
  if (!trimmedId) {
    throw new AppError('Certificate ID is required', 400);
  }

  const cert = await findCertificateByCode(trimmedId);
  if (!cert) {
    return null;
  }

  const verifyUrl = `${clientUrl.replace(/\/$/, '')}/verify/${cert.certificateId}`;
  const qrDataURL = await generateQRDataURL(verifyUrl);

  return {
    valid: cert.status === 'valid',
    status: cert.status,
    data: {
      certificateId: cert.certificateId,
      participantName: cert.participantName,
      eventName: cert.eventName,
      eventDate: cert.eventDate,
      eventVenue: cert.eventVenue || '',
      issueDate: cert.issueDate,
      status: cert.status,
      revokedAt: cert.revokedAt,
      revocationReason: cert.status === 'revoked' ? cert.revocationReason : undefined,
      verifyUrl,
      qrCode: qrDataURL,
      organizer: 'EventHub Student Organization & Technical Affairs',
      issuedBy: 'EventHub Verification Registry',
    },
  };
}

/**
 * Build PDFKit document stream for a certificate.
 */
export async function buildCertificatePDF(certificateId, clientUrl) {
  const trimmedId = String(certificateId || '').trim();
  if (!trimmedId) {
    throw new AppError('Certificate ID is required', 400);
  }

  const cert = await findCertificateByCode(trimmedId);
  if (!cert) {
    throw new AppError('Certificate not found', 404);
  }

  if (cert.status === 'revoked') {
    throw new AppError(
      'This certificate has been revoked and cannot be downloaded as a valid credential.',
      400
    );
  }

  const doc = await createCertificatePDF(cert, clientUrl);
  return { cert, doc };
}

/**
 * Admin: List all events and their registered participants with attendance & certificate status.
 */
export async function getEventsWithCertificateParticipants(clientUrl) {
  const [events, registrations, allCerts] = await Promise.all([
    Event.find({}).sort({ date: -1 }).lean(),
    Registration.find({ status: { $ne: 'cancelled' } })
      .populate('student', 'fullName email studentId collegeName')
      .lean(),
    Certificate.find({}).sort({ createdAt: -1 }).lean(),
  ]);

  const certsWithQR = await attachQRCodes(allCerts, clientUrl);
  const certByStudentEvent = new Map();
  for (const cert of certsWithQR) {
    certByStudentEvent.set(`${cert.student.toString()}:${cert.event.toString()}`, cert);
  }

  return events.map((evt) => {
    const evtId = evt._id.toString();
    const participants = registrations
      .filter((reg) => reg.event.toString() === evtId && reg.student)
      .map((reg) => {
        const stuId = reg.student._id.toString();
        const cert = certByStudentEvent.get(`${stuId}:${evtId}`) || null;
        return {
          registrationId: reg._id.toString(),
          participantId: stuId,
          participantName: reg.student.fullName,
          participantEmail: reg.student.email,
          studentRollId: reg.student.studentId,
          collegeName: reg.student.collegeName,
          eventId: evtId,
          registrationStatus: reg.status,
          attendance: reg.attendanceStatus === 'present' ? 'present' : 'absent',
          attendanceStatus: reg.attendanceStatus,
          checkedInAt: reg.checkedInAt,
          certificate: cert,
          certificateStatus: cert ? cert.status : 'not_generated',
        };
      });

    return {
      eventId: evtId,
      eventName: evt.title,
      category: evt.category,
      eventDate: formatEventDateLabel(evt.date),
      rawDate: evt.date,
      venue: evt.venue,
      status: evt.status,
      participants,
    };
  });
}

/**
 * Admin: Bulk generate certificates for all eligible ('present') participants of an event.
 */
export async function generateCertificatesForEvent(eventId, adminUserId, clientUrl) {
  if (!mongoose.isValidObjectId(eventId)) {
    throw new AppError(`Invalid event ID "${eventId}"`, 400);
  }

  const event = await Event.findById(eventId).lean();
  if (!event) {
    throw new AppError(`Event with ID "${eventId}" was not found.`, 404);
  }

  const registrations = await Registration.find({
    event: eventId,
    status: { $ne: 'cancelled' },
  })
    .populate('student', 'fullName email')
    .lean();

  const totalParticipants = registrations.length;
  const eligibleRegistrations = registrations.filter(
    (r) => r.status === 'confirmed' && r.attendanceStatus === 'present' && r.student
  );
  const ineligibleParticipants = totalParticipants - eligibleRegistrations.length;

  const existingCerts = await Certificate.find({ event: eventId }).select('student').lean();
  const existingStudentIds = new Set(existingCerts.map((c) => c.student.toString()));

  const generatedCerts = [];
  let alreadyIssuedCount = 0;

  for (const reg of eligibleRegistrations) {
    const studentIdStr = reg.student._id.toString();
    if (existingStudentIds.has(studentIdStr)) {
      alreadyIssuedCount += 1;
      continue;
    }

    const created = await createUniqueCertificateRecord({
      student: reg.student._id,
      event: event._id,
      registration: reg._id,
      participantName: reg.student.fullName,
      participantEmail: reg.student.email || '',
      eventName: event.title,
      eventDate: formatEventDateLabel(event.date),
      eventVenue: event.venue || '',
      issueDate: new Date(),
      issuedBy: adminUserId,
      status: 'valid',
    });

    generatedCerts.push(created);
  }

  const generatedWithQR = await attachQRCodes(generatedCerts, clientUrl);

  return {
    eventName: event.title,
    summary: {
      totalParticipants,
      eligibleParticipants: eligibleRegistrations.length,
      ineligibleParticipants,
      certificatesGenerated: generatedWithQR.length,
      alreadyIssued: alreadyIssuedCount,
    },
    data: generatedWithQR,
  };
}

/**
 * Admin: Generate a single certificate for an eligible ('present') participant.
 */
export async function generateCertificateForParticipant(
  { eventId, participantId },
  adminUserId,
  clientUrl
) {
  if (!eventId || !participantId) {
    throw new AppError('eventId and participantId are required', 400);
  }

  if (!mongoose.isValidObjectId(eventId) || !mongoose.isValidObjectId(participantId)) {
    throw new AppError('Invalid eventId or participantId', 400);
  }

  const event = await Event.findById(eventId).lean();
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const registration = await Registration.findOne({
    event: eventId,
    student: participantId,
    status: { $ne: 'cancelled' },
  })
    .populate('student', 'fullName email')
    .lean();

  if (!registration || !registration.student) {
    throw new AppError('Participant registration not found for this event', 404);
  }

  if (registration.status !== 'confirmed' || registration.attendanceStatus !== 'present') {
    throw new AppError(
      'Participant is ineligible: registration must be confirmed and attendance must be marked as present to receive a certificate.',
      400
    );
  }

  const existing = await Certificate.findOne({ event: eventId, student: participantId });
  if (existing) {
    return {
      conflict: true,
      message: `Certificate already issued with ID ${existing.certificateId}`,
      data: await attachQRCode(existing, clientUrl),
    };
  }

  const created = await createUniqueCertificateRecord({
    student: registration.student._id,
    event: event._id,
    registration: registration._id,
    participantName: registration.student.fullName,
    participantEmail: registration.student.email || '',
    eventName: event.title,
    eventDate: formatEventDateLabel(event.date),
    eventVenue: event.venue || '',
    issueDate: new Date(),
    issuedBy: adminUserId,
    status: 'valid',
  });

  return {
    conflict: false,
    data: await attachQRCode(created, clientUrl),
  };
}

/**
 * Admin: Revoke an existing certificate with an audit reason.
 */
export async function revokeCertificateById(certificateId, reason, adminUserId, clientUrl) {
  const trimmedId = String(certificateId || '').trim();
  if (!trimmedId) {
    throw new AppError('Certificate ID is required', 400);
  }

  const revocationReason = String(reason || '').trim();
  if (!revocationReason) {
    throw new AppError('A revocation reason is required.', 400);
  }

  const updated = await Certificate.findOneAndUpdate(
    { certificateId: new RegExp(`^${escapeRegex(trimmedId)}$`, 'i') },
    {
      status: 'revoked',
      revokedAt: new Date(),
      revocationReason,
      revokedBy: adminUserId,
    },
    { new: true }
  );

  if (!updated) {
    throw new AppError('Certificate not found', 404);
  }

  return attachQRCode(updated, clientUrl);
}
