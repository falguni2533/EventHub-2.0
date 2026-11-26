import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_SECRET ||= 'eventhub-attendance-test-jwt-secret';
process.env.ADMIN_SETUP_KEY ||= 'eventhub-attendance-test-admin-key';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Event } = await import('../src/models/Event.js');
const { default: Registration } = await import('../src/models/Registration.js');

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

  const data = await response.json();
  return { status: response.status, data };
};

const registerUser = async (overrides = {}) => {
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

describe('Attendance Analytics & Role Isolation Integration', () => {
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

  it('1. Computes real Admin Attendance summary, charts, and supports event/status/search filters', async () => {
    const studentA = await registerUser({
      fullName: 'Aarav Sharma',
      email: 'aarav@college.edu',
      studentId: 'CS2026-042',
    });
    const studentB = await registerUser({
      fullName: 'Diya Patel',
      email: 'diya@college.edu',
      studentId: 'CS2026-099',
    });
    const admin = await registerUser({
      fullName: 'Campus Admin',
      email: 'admin@college.edu',
      studentId: 'ADMIN-001',
      role: 'admin',
      adminSetupKey: process.env.ADMIN_SETUP_KEY,
    });

    const day1 = new Date('2026-10-10T10:00:00.000Z');
    const day2 = new Date('2026-10-18T10:00:00.000Z');

    const [evt1, evt2] = await Event.create([
      { title: 'AI Summit', category: 'Tech', date: day1, venue: 'Hall A', status: 'completed', createdBy: admin.user.id },
      { title: 'Cloud Workshop', category: 'Workshop', date: day2, venue: 'Lab 2', status: 'published', createdBy: admin.user.id },
    ]);

    await Registration.create([
      { student: studentA.user.id, event: evt1._id, status: 'confirmed', passStatus: 'used', attendanceStatus: 'present', checkedInAt: day1 },
      { student: studentA.user.id, event: evt2._id, status: 'confirmed', passStatus: 'active', attendanceStatus: 'not_marked' },
      { student: studentB.user.id, event: evt1._id, status: 'confirmed', passStatus: 'active', attendanceStatus: 'absent' },
    ]);

    const allRes = await api('/admin/attendance/analytics', { token: admin.token });
    assert.equal(allRes.status, 200);
    assert.equal(allRes.data.data.summary.totalStudents, 2);
    assert.equal(allRes.data.data.summary.totalRecords, 3);
    assert.equal(allRes.data.data.summary.presentStudents, 1);
    assert.equal(allRes.data.data.summary.absentStudents, 2);
    assert.equal(allRes.data.data.summary.attendancePercentage, 33);
    assert.equal(allRes.data.data.charts.presentVsAbsent.present, 1);
    assert.equal(allRes.data.data.charts.presentVsAbsent.absent, 2);
    assert.equal(allRes.data.data.charts.eventWiseAttendance.length, 2);
    assert.ok(allRes.data.data.charts.weeklyTrends.length >= 2);

    const searchRes = await api('/admin/attendance/analytics?search=CS2026-099&status=absent', {
      token: admin.token,
    });
    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.data.data.records.length, 1);
    assert.equal(searchRes.data.data.records[0].studentName, 'Diya Patel');
    assert.equal(searchRes.data.data.summary.attendancePercentage, 0);
  });

  it('2. Scopes Student Attendance strictly to the authenticated student and blocks cross-role access', async () => {
    const studentA = await registerUser({
      fullName: 'Aarav Sharma',
      email: 'aarav@college.edu',
      studentId: 'CS2026-042',
    });
    const studentB = await registerUser({
      fullName: 'Diya Patel',
      email: 'diya@college.edu',
      studentId: 'CS2026-099',
    });
    const admin = await registerUser({
      fullName: 'Campus Admin',
      email: 'admin@college.edu',
      studentId: 'ADMIN-001',
      role: 'admin',
      adminSetupKey: process.env.ADMIN_SETUP_KEY,
    });

    const d1 = new Date('2026-10-10T10:00:00.000Z');
    const [evt1, evt2] = await Event.create([
      { title: 'AI Summit', category: 'Tech', date: d1, venue: 'Hall A', status: 'completed', createdBy: admin.user.id },
      { title: 'Hackathon', category: 'Tech', date: d1, venue: 'Arena', status: 'completed', createdBy: admin.user.id },
    ]);

    await Registration.create([
      { student: studentA.user.id, event: evt1._id, status: 'confirmed', passStatus: 'used', attendanceStatus: 'present', checkedInAt: d1 },
      { student: studentB.user.id, event: evt2._id, status: 'confirmed', passStatus: 'active', attendanceStatus: 'absent' },
    ]);

    const resA = await api('/student/attendance', { token: studentA.token });
    assert.equal(resA.status, 200);
    assert.equal(resA.data.data.summary.totalRegistered, 1);
    assert.equal(resA.data.data.summary.eventsAttended, 1);
    assert.equal(resA.data.data.summary.eventsMissed, 0);
    assert.equal(resA.data.data.summary.attendancePercentage, 100);
    assert.equal(resA.data.data.records.length, 1);
    assert.equal(resA.data.data.records[0].eventTitle, 'AI Summit');

    const aliasRes = await api('/attendance/my', { token: studentA.token });
    assert.equal(aliasRes.status, 200);
    assert.equal(aliasRes.data.data.summary.eventsAttended, 1);

    // Role enforcement
    const studentTriesAdmin = await api('/admin/attendance/analytics', { token: studentA.token });
    assert.equal(studentTriesAdmin.status, 403);

    const adminTriesStudent = await api('/student/attendance', { token: admin.token });
    assert.equal(adminTriesStudent.status, 403);

    const unauth = await api('/student/attendance');
    assert.equal(unauth.status, 401);
  });
});
