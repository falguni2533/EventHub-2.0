import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Event from '../src/models/Event.js';
import Registration from '../src/models/Registration.js';

let mongoServer;
let httpServer;
let baseUrl;

const api = async (path, { method = 'GET', body, token } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/pdf')) {
    const buf = Buffer.from(await response.arrayBuffer());
    return { status: response.status, pdfHeader: buf.subarray(0, 5).toString('utf8'), buffer: buf };
  }

  const data = await response.json();
  return { status: response.status, data };
};

const registerStudent = async (overrides = {}) => {
  const res = await api('/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Aarav Sharma',
      email: 'aarav@college.edu',
      password: 'Password123',
      confirmPassword: 'Password123',
      collegeName: 'NIT Campus',
      studentId: 'CS2026-042',
      ...overrides,
    },
  });
  return res.data.data;
};

const registerAdmin = async () => {
  const res = await api('/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Campus Admin',
      email: 'admin@college.edu',
      password: 'Password123',
      confirmPassword: 'Password123',
      collegeName: 'NIT Campus',
      studentId: 'ADMIN-001',
      role: 'admin',
      adminSetupKey: process.env.ADMIN_SETUP_KEY,
    },
  });
  return res.data.data;
};

describe('Event Passes & Admin QR Check-in Integration', () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create({
      instance: { launchTimeout: 60000 },
    });
    await mongoose.connect(mongoServer.getUri());
    httpServer = app.listen(0);
    await new Promise((resolve) => httpServer.once('listening', resolve));
    const { port } = httpServer.address();
    baseUrl = `http://localhost:${port}/api`;
  }, { timeout: 90000 });

  beforeEach(async () => {
    await Promise.all([
      Registration.deleteMany({}),
      Event.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  after(async () => {
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('1. Generates opaque pass tokens, classifies Upcoming vs Past tabs and all 6 pass statuses, and streams PDF pass', async () => {
    const student = await registerStudent();
    const admin = await registerAdmin();

    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const [evtValid, evtCheckedIn, evtAttended, evtMissed, evtCancelledReg, evtCancelled] =
      await Event.create([
        { title: 'AI Summit', category: 'Tech', date: futureDate, venue: 'Hall A', status: 'published', createdBy: admin.user.id },
        { title: 'Cloud Lab', category: 'Workshop', date: futureDate, venue: 'Lab 1', status: 'published', createdBy: admin.user.id },
        { title: 'Hackfest 2025', category: 'Hackathon', date: pastDate, venue: 'Arena', status: 'completed', createdBy: admin.user.id },
        { title: 'Design Sprint', category: 'Design', date: pastDate, venue: 'Studio 2', status: 'completed', createdBy: admin.user.id },
        { title: 'Robotics Expo', category: 'Robotics', date: futureDate, venue: 'Grounds', status: 'published', createdBy: admin.user.id },
        { title: 'Cancelled Conf', category: 'Seminar', date: futureDate, venue: 'Auditorium', status: 'cancelled', createdBy: admin.user.id },
      ]);

    const regs = await Registration.create([
      { student: student.user.id, event: evtValid._id, status: 'confirmed' },
      { student: student.user.id, event: evtCheckedIn._id, status: 'confirmed', passStatus: 'used', attendanceStatus: 'present', checkedInAt: new Date() },
      { student: student.user.id, event: evtAttended._id, status: 'confirmed', passStatus: 'used', attendanceStatus: 'present', checkedInAt: pastDate },
      { student: student.user.id, event: evtMissed._id, status: 'confirmed', passStatus: 'active', attendanceStatus: 'not_marked' },
      { student: student.user.id, event: evtCancelledReg._id, status: 'cancelled' },
      { student: student.user.id, event: evtCancelled._id, status: 'confirmed' },
    ]);

    // Verify opaque passToken has no PII
    assert.ok(regs[0].passToken.startsWith('evhp_'));
    assert.equal(regs[0].passToken.includes('aarav'), false);
    assert.equal(regs[0].passToken.includes(student.user.studentId), false);

    const res = await api('/student/passes', { token: student.token });
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);

    const byTitle = new Map(res.data.data.passes.map((p) => [p.event.title, p]));
    assert.equal(byTitle.get('AI Summit').displayStatus, 'Valid');
    assert.equal(byTitle.get('AI Summit').tab, 'upcoming');
    assert.ok(byTitle.get('AI Summit').qrCode.startsWith('data:image/png;base64,'));

    assert.equal(byTitle.get('Cloud Lab').displayStatus, 'Checked In');
    assert.equal(byTitle.get('Hackfest 2025').displayStatus, 'Attended');
    assert.equal(byTitle.get('Hackfest 2025').tab, 'past');
    assert.equal(byTitle.get('Design Sprint').displayStatus, 'Missed/Expired');
    assert.equal(byTitle.get('Design Sprint').tab, 'past');
    assert.equal(byTitle.get('Robotics Expo').displayStatus, 'Cancelled');
    assert.equal(byTitle.get('Cancelled Conf').displayStatus, 'Event Cancelled');

    // Download PDF pass
    const pdfRes = await api(`/student/passes/${regs[0]._id}/download`, { token: student.token });
    assert.equal(pdfRes.status, 200);
    assert.equal(pdfRes.pdfHeader, '%PDF-');
  });

  it('2. Enforces admin-only pass verification, marks attendance once, prevents duplicate check-ins, and rejects certificate IDs', async () => {
    const student = await registerStudent();
    const admin = await registerAdmin();

    const event = await Event.create({
      title: 'RavenX Hackathon',
      category: 'Hackathon',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      venue: 'Main Auditorium',
      status: 'published',
      createdBy: admin.user.id,
    });

    const reg = await Registration.create({
      student: student.user.id,
      event: event._id,
      status: 'confirmed',
    });

    // Student cannot check in
    const studentAttempt = await api('/admin/passes/check-in', {
      method: 'POST',
      token: student.token,
      body: { token: reg.passToken },
    });
    assert.equal(studentAttempt.status, 403);

    // Certificate ID rejected in pass endpoint
    const certIdAttempt = await api('/admin/passes/verify', {
      method: 'POST',
      token: admin.token,
      body: { token: 'EVH-2026-A7F39C2B' },
    });
    assert.equal(certIdAttempt.status, 400);

    // Admin verifies pass
    const verifyRes = await api('/admin/passes/verify', {
      method: 'POST',
      token: admin.token,
      body: { token: reg.passToken, eventId: event._id.toString() },
    });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.data.data.eligible, true);
    assert.equal(verifyRes.data.data.student.fullName, 'Aarav Sharma');

    // Concurrent check-in attempts: only one succeeds, the other gets 409
    const [first, second] = await Promise.all([
      api('/admin/passes/check-in', {
        method: 'POST',
        token: admin.token,
        body: { token: reg.passToken },
      }),
      api('/admin/passes/check-in', {
        method: 'POST',
        token: admin.token,
        body: { token: reg.passToken },
      }),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    assert.deepEqual(statuses, [200, 409]);

    const updatedReg = await Registration.findById(reg._id).lean();
    assert.equal(updatedReg.attendanceStatus, 'present');
    assert.equal(updatedReg.passStatus, 'used');
    assert.ok(updatedReg.checkedInAt);
  });
});
