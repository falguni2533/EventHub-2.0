import crypto from 'node:crypto';
import { env, validateEnv } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Certificate from '../models/Certificate.js';
import { generateCertificateId } from '../utils/generateCertificateId.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const formatEventDateLabel = (dateVal) => {
  const d = new Date(dateVal);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ensureDemoStudent = async ({ seedKey, fullName, email, collegeName, studentId }) => {
  const existing = await User.findOne({ $or: [{ seedKey }, { email }] });
  if (existing) return { doc: existing, created: false };

  // Generate an unguessable random password so no hardcoded credentials exist.
  const randomPassword = `${crypto.randomBytes(24).toString('base64url')}Aa1!`;
  const created = await User.create({
    fullName,
    email,
    password: randomPassword,
    collegeName,
    studentId,
    role: 'student',
    accountStatus: 'Inactive',
    isDemo: true,
    seedKey,
  });
  return { doc: created, created: true };
};

const ensureEvent = async (spec, adminUser) => {
  const existing = await Event.findOne({ seedKey: spec.seedKey });
  if (existing) return { doc: existing, created: false };

  const created = await Event.create({
    title: spec.title,
    description: spec.description,
    category: spec.category,
    date: spec.date,
    venue: spec.venue,
    capacity: spec.capacity,
    status: spec.status,
    createdBy: adminUser?._id || null,
    isDemo: true,
    seedKey: spec.seedKey,
  });
  return { doc: created, created: true };
};

const ensureRegistration = async ({
  seedKey,
  student,
  event,
  status = 'confirmed',
  passStatus = 'active',
  attendanceStatus = 'not_marked',
  checkedInAt = null,
  checkedInBy = null,
  registeredAt = new Date(),
}) => {
  const existing = await Registration.findOne({
    $or: [{ seedKey }, { student: student._id, event: event._id }],
  });
  if (existing) return { doc: existing, created: false };

  const created = await Registration.create({
    student: student._id,
    event: event._id,
    status,
    passStatus,
    attendanceStatus,
    checkedInAt,
    checkedInBy,
    registeredAt,
    isDemo: true,
    seedKey,
  });
  return { doc: created, created: true };
};

const ensureCertificate = async ({
  seedKey,
  student,
  event,
  registration,
  issuedBy,
  status = 'valid',
  issueDate = new Date(),
  revokedAt = null,
  revocationReason = '',
  revokedBy = null,
}) => {
  const existing = await Certificate.findOne({
    $or: [{ seedKey }, { student: student._id, event: event._id }],
  });
  if (existing) return { doc: existing, created: false };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const certificateId = generateCertificateId(new Date(issueDate).getFullYear());
    try {
      const created = await Certificate.create({
        certificateId,
        student: student._id,
        event: event._id,
        registration: registration._id,
        participantName: student.fullName,
        participantEmail: student.email || '',
        eventName: event.title,
        eventDate: formatEventDateLabel(event.date),
        eventVenue: event.venue || '',
        issueDate,
        issuedBy: issuedBy?._id || null,
        status,
        revokedAt,
        revocationReason,
        revokedBy: revokedBy?._id || null,
        isDemo: true,
        seedKey,
      });
      return { doc: created, created: true };
    } catch (err) {
      if (err?.code === 11000 && err?.keyPattern?.certificateId) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(`Could not allocate unique certificate ID for ${seedKey}`);
};

const resolvePrimaryStudent = async () => {
  const overrideEmail = (process.env.DEMO_STUDENT_EMAIL || '').trim().toLowerCase();
  if (overrideEmail) {
    const found = await User.findOne({ email: overrideEmail, role: 'student' });
    if (!found) {
      throw new Error(`No student account found for DEMO_STUDENT_EMAIL=${overrideEmail}`);
    }
    return found;
  }

  const realStudent = await User.findOne({ role: 'student', isDemo: { $ne: true } }).sort({
    createdAt: 1,
  });
  if (realStudent) return realStudent;

  throw new Error(
    'No existing student account found in MongoDB. Please register a student account via the app before running seed:demo.'
  );
};

const resolvePrimaryAdmin = async () => {
  const overrideEmail = (process.env.DEMO_ADMIN_EMAIL || '').trim().toLowerCase();
  if (overrideEmail) {
    return User.findOne({ email: overrideEmail, role: 'admin' });
  }
  return User.findOne({ role: 'admin', isDemo: { $ne: true } }).sort({ createdAt: 1 });
};

const runDemoSeed = async () => {
  validateEnv();

  if (env.nodeEnv === 'production') {
    throw new Error('Refusing to run demo seed script when NODE_ENV=production.');
  }

  await connectDatabase();

  try {
    const now = Date.now();
    const primaryStudent = await resolvePrimaryStudent();
    const primaryAdmin = await resolvePrimaryAdmin();

    console.log(
      `[SeedDemo] Target student: ${primaryStudent.fullName} (${primaryStudent.studentId})`
    );
    if (primaryAdmin) {
      console.log(
        `[SeedDemo] Target admin: ${primaryAdmin.fullName} (${primaryAdmin.studentId})`
      );
    } else {
      console.warn('[SeedDemo] No admin account found; issuing admin metadata will be null.');
    }

    const demoStudentsResults = await Promise.all([
      ensureDemoStudent({
        seedKey: 'demo-student-rohan',
        fullName: 'Rohan Verma',
        email: 'rohan.verma.demo@eventhub.local',
        collegeName: primaryStudent.collegeName || 'GLA',
        studentId: 'DEMO-CS-101',
      }),
      ensureDemoStudent({
        seedKey: 'demo-student-ananya',
        fullName: 'Ananya Patel',
        email: 'ananya.patel.demo@eventhub.local',
        collegeName: primaryStudent.collegeName || 'GLA',
        studentId: 'DEMO-CS-102',
      }),
      ensureDemoStudent({
        seedKey: 'demo-student-kabir',
        fullName: 'Kabir Mehta',
        email: 'kabir.mehta.demo@eventhub.local',
        collegeName: primaryStudent.collegeName || 'GLA',
        studentId: 'DEMO-CS-103',
      }),
    ]);

    const [rohan, ananya, kabir] = demoStudentsResults.map((r) => r.doc);

    const eventSpecs = [
      {
        seedKey: 'demo-evt-ai-summit',
        title: 'AI & Generative Systems Summit 2026',
        description:
          'Hands-on keynote and technical tracks on LLM systems, agent architectures, and applied AI.',
        category: 'AI & ML',
        date: new Date(now + 7 * DAY_MS),
        venue: 'Main Auditorium, Block A',
        capacity: 250,
        status: 'published',
      },
      {
        seedKey: 'demo-evt-cloud-workshop',
        title: 'Cloud Native & Kubernetes Workshop',
        description:
          'Deep-dive lab covering containers, Kubernetes deployments, observability, and scaling.',
        category: 'Workshop',
        date: new Date(now + 12 * DAY_MS),
        venue: 'Innovation Lab 204',
        capacity: 120,
        status: 'published',
      },
      {
        seedKey: 'demo-evt-cyber-ctf',
        title: 'CyberShield Campus CTF 2026',
        description:
          'Capture-the-flag cybersecurity competition spanning web, cryptography, and forensics.',
        category: 'Cybersecurity',
        date: new Date(now + 18 * DAY_MS),
        venue: 'CSE Seminar Hall',
        capacity: 150,
        status: 'published',
      },
      {
        seedKey: 'demo-evt-startup-pitch',
        title: 'Campus Startup Pitch Arena',
        description:
          'Live startup showcase where student teams pitch prototypes to alumni founders and mentors.',
        category: 'Entrepreneurship',
        date: new Date(now + 22 * DAY_MS),
        venue: 'E-Cell Studio',
        capacity: 100,
        status: 'published',
      },
      {
        seedKey: 'demo-evt-robotics-expo',
        title: 'Autonomous Robotics Expo 2026',
        description:
          'Campus robotics exhibition featuring autonomous rovers, drones, and embedded hardware.',
        category: 'Robotics',
        date: new Date(now + 26 * DAY_MS),
        venue: 'Central Exhibition Grounds',
        capacity: 180,
        status: 'published',
      },
      {
        seedKey: 'demo-evt-hackfest',
        title: 'EventHub National HackFest 2026',
        description:
          '36-hour flagship campus hackathon building full-stack solutions for campus sustainability.',
        category: 'Hackathon',
        date: new Date(now - 25 * DAY_MS),
        venue: 'Tech Arena Hall 1',
        capacity: 300,
        status: 'completed',
      },
      {
        seedKey: 'demo-evt-design-sprint',
        title: 'UI/UX Product Design Sprint',
        description:
          'Rapid prototyping and usability testing sprint focused on accessible student portals.',
        category: 'Design',
        date: new Date(now - 14 * DAY_MS),
        venue: 'Design Studio B',
        capacity: 90,
        status: 'completed',
      },
      {
        seedKey: 'demo-evt-web3-bootcamp',
        title: 'Full-Stack & Web3 Bootcamp',
        description:
          'Intensive engineering bootcamp covering Node.js APIs, security, and decentralized identity.',
        category: 'Workshop',
        date: new Date(now - 7 * DAY_MS),
        venue: 'Auditorium Annex',
        capacity: 140,
        status: 'completed',
      },
      {
        seedKey: 'demo-evt-open-source-day',
        title: 'Campus Open Source Day',
        description:
          'Community contribution sprint introducing Git workflows, issue triage, and OSS licensing.',
        category: 'Community',
        date: new Date(now - 3 * DAY_MS),
        venue: 'Lecture Complex 3',
        capacity: 160,
        status: 'completed',
      },
    ];

    const eventMap = new Map();
    let eventsCreated = 0;
    for (const spec of eventSpecs) {
      const res = await ensureEvent(spec, primaryAdmin);
      eventMap.set(spec.seedKey, res.doc);
      if (res.created) eventsCreated += 1;
    }

    const registrationSpecs = [
      // Primary student: 3 active upcoming passes, 1 checked-in upcoming pass, 1 revoked pass
      {
        seedKey: 'demo-reg-primary-ai-summit',
        student: primaryStudent,
        event: eventMap.get('demo-evt-ai-summit'),
        status: 'confirmed',
        passStatus: 'active',
        attendanceStatus: 'not_marked',
        registeredAt: new Date(now - 2 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-primary-cloud-workshop',
        student: primaryStudent,
        event: eventMap.get('demo-evt-cloud-workshop'),
        status: 'confirmed',
        passStatus: 'active',
        attendanceStatus: 'not_marked',
        registeredAt: new Date(now - 2 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-primary-cyber-ctf',
        student: primaryStudent,
        event: eventMap.get('demo-evt-cyber-ctf'),
        status: 'confirmed',
        passStatus: 'active',
        attendanceStatus: 'not_marked',
        registeredAt: new Date(now - 1 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-primary-startup-pitch',
        student: primaryStudent,
        event: eventMap.get('demo-evt-startup-pitch'),
        status: 'confirmed',
        passStatus: 'used',
        attendanceStatus: 'present',
        checkedInAt: new Date(now - 1 * HOUR_MS),
        checkedInBy: primaryAdmin?._id || null,
        registeredAt: new Date(now - 3 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-primary-robotics-expo',
        student: primaryStudent,
        event: eventMap.get('demo-evt-robotics-expo'),
        status: 'confirmed',
        passStatus: 'revoked',
        attendanceStatus: 'not_marked',
        registeredAt: new Date(now - 3 * DAY_MS),
      },
      // Primary student: 4 historical past passes (3 attended, 1 missed/expired)
      {
        seedKey: 'demo-reg-primary-hackfest',
        student: primaryStudent,
        event: eventMap.get('demo-evt-hackfest'),
        status: 'confirmed',
        passStatus: 'used',
        attendanceStatus: 'present',
        checkedInAt: new Date(now - 25 * DAY_MS),
        checkedInBy: primaryAdmin?._id || null,
        registeredAt: new Date(now - 30 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-primary-design-sprint',
        student: primaryStudent,
        event: eventMap.get('demo-evt-design-sprint'),
        status: 'confirmed',
        passStatus: 'used',
        attendanceStatus: 'present',
        checkedInAt: new Date(now - 14 * DAY_MS),
        checkedInBy: primaryAdmin?._id || null,
        registeredAt: new Date(now - 18 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-primary-web3-bootcamp',
        student: primaryStudent,
        event: eventMap.get('demo-evt-web3-bootcamp'),
        status: 'confirmed',
        passStatus: 'used',
        attendanceStatus: 'present',
        checkedInAt: new Date(now - 7 * DAY_MS),
        checkedInBy: primaryAdmin?._id || null,
        registeredAt: new Date(now - 10 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-primary-open-source-day',
        student: primaryStudent,
        event: eventMap.get('demo-evt-open-source-day'),
        status: 'confirmed',
        passStatus: 'active',
        attendanceStatus: 'absent',
        registeredAt: new Date(now - 6 * DAY_MS),
      },
      // Demo co-participants for Admin Manage Certificates & Attendance tables
      {
        seedKey: 'demo-reg-rohan-ai-summit',
        student: rohan,
        event: eventMap.get('demo-evt-ai-summit'),
        status: 'confirmed',
        passStatus: 'active',
        attendanceStatus: 'not_marked',
        registeredAt: new Date(now - 2 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-ananya-ai-summit',
        student: ananya,
        event: eventMap.get('demo-evt-ai-summit'),
        status: 'confirmed',
        passStatus: 'used',
        attendanceStatus: 'present',
        checkedInAt: new Date(now - 2 * HOUR_MS),
        checkedInBy: primaryAdmin?._id || null,
        registeredAt: new Date(now - 2 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-kabir-cloud-workshop',
        student: kabir,
        event: eventMap.get('demo-evt-cloud-workshop'),
        status: 'confirmed',
        passStatus: 'active',
        attendanceStatus: 'not_marked',
        registeredAt: new Date(now - 1 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-rohan-hackfest',
        student: rohan,
        event: eventMap.get('demo-evt-hackfest'),
        status: 'confirmed',
        passStatus: 'used',
        attendanceStatus: 'present',
        checkedInAt: new Date(now - 25 * DAY_MS),
        checkedInBy: primaryAdmin?._id || null,
        registeredAt: new Date(now - 29 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-ananya-hackfest',
        student: ananya,
        event: eventMap.get('demo-evt-hackfest'),
        status: 'confirmed',
        passStatus: 'active',
        attendanceStatus: 'absent',
        registeredAt: new Date(now - 29 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-kabir-hackfest',
        student: kabir,
        event: eventMap.get('demo-evt-hackfest'),
        status: 'confirmed',
        passStatus: 'used',
        attendanceStatus: 'present',
        checkedInAt: new Date(now - 25 * DAY_MS),
        checkedInBy: primaryAdmin?._id || null,
        registeredAt: new Date(now - 29 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-rohan-design-sprint',
        student: rohan,
        event: eventMap.get('demo-evt-design-sprint'),
        status: 'confirmed',
        passStatus: 'used',
        attendanceStatus: 'present',
        checkedInAt: new Date(now - 14 * DAY_MS),
        checkedInBy: primaryAdmin?._id || null,
        registeredAt: new Date(now - 17 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-ananya-design-sprint',
        student: ananya,
        event: eventMap.get('demo-evt-design-sprint'),
        status: 'confirmed',
        passStatus: 'active',
        attendanceStatus: 'not_marked',
        registeredAt: new Date(now - 17 * DAY_MS),
      },
      {
        seedKey: 'demo-reg-kabir-web3-bootcamp',
        student: kabir,
        event: eventMap.get('demo-evt-web3-bootcamp'),
        status: 'confirmed',
        passStatus: 'active',
        attendanceStatus: 'absent',
        registeredAt: new Date(now - 9 * DAY_MS),
      },
    ];

    const regMap = new Map();
    let regsCreated = 0;
    for (const spec of registrationSpecs) {
      const res = await ensureRegistration(spec);
      regMap.set(spec.seedKey, res.doc);
      if (res.created) regsCreated += 1;
    }

    const certificateSpecs = [
      {
        seedKey: 'demo-cert-primary-hackfest',
        student: primaryStudent,
        event: eventMap.get('demo-evt-hackfest'),
        registration: regMap.get('demo-reg-primary-hackfest'),
        issuedBy: primaryAdmin,
        status: 'valid',
        issueDate: new Date(now - 24 * DAY_MS),
      },
      {
        seedKey: 'demo-cert-primary-design-sprint',
        student: primaryStudent,
        event: eventMap.get('demo-evt-design-sprint'),
        registration: regMap.get('demo-reg-primary-design-sprint'),
        issuedBy: primaryAdmin,
        status: 'valid',
        issueDate: new Date(now - 13 * DAY_MS),
      },
      {
        seedKey: 'demo-cert-primary-web3-bootcamp',
        student: primaryStudent,
        event: eventMap.get('demo-evt-web3-bootcamp'),
        registration: regMap.get('demo-reg-primary-web3-bootcamp'),
        issuedBy: primaryAdmin,
        status: 'revoked',
        issueDate: new Date(now - 6 * DAY_MS),
        revokedAt: new Date(now - 4 * DAY_MS),
        revocationReason:
          'Demo audit: duplicate team submission flagged during post-event review.',
        revokedBy: primaryAdmin,
      },
      {
        seedKey: 'demo-cert-kabir-hackfest',
        student: kabir,
        event: eventMap.get('demo-evt-hackfest'),
        registration: regMap.get('demo-reg-kabir-hackfest'),
        issuedBy: primaryAdmin,
        status: 'valid',
        issueDate: new Date(now - 24 * DAY_MS),
      },
      {
        seedKey: 'demo-cert-rohan-design-sprint',
        student: rohan,
        event: eventMap.get('demo-evt-design-sprint'),
        registration: regMap.get('demo-reg-rohan-design-sprint'),
        issuedBy: primaryAdmin,
        status: 'valid',
        issueDate: new Date(now - 13 * DAY_MS),
      },
    ];

    const certMap = new Map();
    let certsCreated = 0;
    for (const spec of certificateSpecs) {
      const res = await ensureCertificate(spec);
      certMap.set(spec.seedKey, res.doc);
      if (res.created) certsCreated += 1;
    }

    const demoStudentsCreated = demoStudentsResults.filter((r) => r.created).length;
    const [totalEvents, totalRegistrations, totalCertificates] = await Promise.all([
      Event.countDocuments({}),
      Registration.countDocuments({}),
      Certificate.countDocuments({}),
    ]);

    console.log('\n[SeedDemo] Demo seed completed idempotently.');
    console.log(
      `[SeedDemo] Created this run -> DemoStudents: ${demoStudentsCreated}, Events: ${eventsCreated}, Registrations: ${regsCreated}, Certificates: ${certsCreated}`
    );
    console.log(
      `[SeedDemo] Collection totals -> Events: ${totalEvents}, Registrations: ${totalRegistrations}, Certificates: ${totalCertificates}`
    );
    console.log('\n[SeedDemo] Verification Reference Codes for Admin Verify QR/ID:');
    console.log(
      `  Active Pass (Falguni - AI Summit):       ${regMap.get('demo-reg-primary-ai-summit')?.passCode}`
    );
    console.log(
      `  Checked-In Pass (Falguni - Pitch Arena): ${regMap.get('demo-reg-primary-startup-pitch')?.passCode}`
    );
    console.log(
      `  Revoked Pass (Falguni - Robotics Expo):  ${regMap.get('demo-reg-primary-robotics-expo')?.passCode}`
    );
    console.log(
      `  Expired Pass (Falguni - Open Source):    ${regMap.get('demo-reg-primary-open-source-day')?.passCode}`
    );
    console.log(
      `  Valid Certificate (Falguni - HackFest):  ${certMap.get('demo-cert-primary-hackfest')?.certificateId}`
    );
    console.log(
      `  Revoked Certificate (Falguni - Web3):    ${certMap.get('demo-cert-primary-web3-bootcamp')?.certificateId}`
    );
  } finally {
    await disconnectDatabase();
  }
};

runDemoSeed().catch((err) => {
  console.error('[SeedDemo] Failed:', err.message);
  process.exit(1);
});
