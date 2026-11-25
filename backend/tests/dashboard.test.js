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

  const data = await response.json();
  return { status: response.status, data };
};

const registerStudent = async (overrides = {}) => {
  const payload = {
    fullName: 'Aarav Sharma',
    email: 'aarav@college.edu',
    password: 'Password123',
    confirmPassword: 'Password123',
    collegeName: 'NIT Campus',
    studentId: 'CS2026-042',
    ...overrides,
  };
  const res = await api('/auth/register', { method: 'POST', body: payload });
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

describe('Phase 2 Student & Admin Dashboard API Integration', () => {
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

  it('1. Returns empty-state zeros and real student count when no events or registrations exist', async () => {
    const student = await registerStudent();
    const admin = await registerAdmin();

    const studentRes = await api('/student/dashboard', { token: student.token });
    assert.equal(studentRes.status, 200);
    assert.equal(studentRes.data.success, true);
    assert.equal(studentRes.data.data.panel, 'student');
    assert.equal(studentRes.data.data.user.email, 'aarav@college.edu');
    assert.equal(studentRes.data.data.stats.upcomingEvents, 0);
    assert.equal(studentRes.data.data.stats.myRegistrations, 0);
    assert.equal(studentRes.data.data.stats.myPasses, 0);
    assert.equal(studentRes.data.data.stats.attendance.attended, 0);
    assert.equal(studentRes.data.data.stats.attendance.rate, null);
    assert.deepEqual(studentRes.data.data.upcomingEvents, []);
    assert.deepEqual(studentRes.data.data.recentActivity, []);

    const adminRes = await api('/admin/dashboard', { token: admin.token });
    assert.equal(adminRes.status, 200);
    assert.equal(adminRes.data.success, true);
    assert.equal(adminRes.data.data.panel, 'admin');
    assert.equal(adminRes.data.data.stats.totalStudents, 1);
    assert.equal(adminRes.data.data.stats.totalEvents, 0);
    assert.equal(adminRes.data.data.stats.totalRegistrations, 0);
    assert.equal(adminRes.data.data.stats.attendanceOverview.present, 0);
    assert.deepEqual(adminRes.data.data.recentRegistrations, []);
    assert.ok(adminRes.data.data.recentActivity.length >= 1);
  });

  it('2. Scopes student dashboard metrics and activity strictly to the authenticated student', async () => {
    const studentA = await registerStudent({
      fullName: 'Aarav Sharma',
      email: 'aarav@college.edu',
      studentId: 'CS2026-042',
    });
    const studentB = await registerStudent({
      fullName: 'Diya Patel',
      email: 'diya@college.edu',
      studentId: 'CS2026-099',
    });
    const admin = await registerAdmin();

    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const [upcomingEvent, pastEvent] = await Event.create([
      {
        title: 'Cosmic Hack 2026',
        description: '24-hour campus hackathon',
        category: 'Hackathon',
        date: futureDate,
        venue: 'Innovation Center',
        capacity: 120,
        status: 'published',
        createdBy: admin.user.id,
      },
      {
        title: 'Cloud Workshop',
        description: 'Hands-on cloud deployment',
        category: 'Workshop',
        date: pastDate,
        venue: 'Lab 204',
        capacity: 60,
        status: 'completed',
        createdBy: admin.user.id,
      },
    ]);

    await Registration.create([
      {
        student: studentA.user.id,
        event: upcomingEvent._id,
        status: 'confirmed',
        passCode: 'EH-PASS-101',
        passStatus: 'active',
        attendanceStatus: 'present',
        checkedInAt: new Date(),
      },
      {
        student: studentB.user.id,
        event: pastEvent._id,
        status: 'pending',
        passStatus: 'none',
        attendanceStatus: 'absent',
      },
    ]);

    const resA = await api('/student/dashboard', { token: studentA.token });
    assert.equal(resA.status, 200);
    assert.equal(resA.data.data.stats.upcomingEvents, 1);
    assert.equal(resA.data.data.stats.myRegistrations, 1);
    assert.equal(resA.data.data.stats.myPasses, 1);
    assert.equal(resA.data.data.stats.attendance.attended, 1);
    assert.equal(resA.data.data.stats.attendance.rate, 100);
    assert.equal(resA.data.data.upcomingEvents.length, 1);
    assert.equal(resA.data.data.upcomingEvents[0].title, 'Cosmic Hack 2026');
    assert.equal(resA.data.data.recentActivity.length, 1);
    assert.equal(resA.data.data.notifications.length, 1);

    const resB = await api('/student/dashboard', { token: studentB.token });
    assert.equal(resB.status, 200);
    assert.equal(resB.data.data.stats.myRegistrations, 1);
    assert.equal(resB.data.data.stats.myPasses, 0);
    assert.equal(resB.data.data.stats.attendance.attended, 0);
    assert.equal(resB.data.data.stats.attendance.rate, 0);
    assert.equal(resB.data.data.notifications.length, 0);

    const adminRes = await api('/admin/dashboard', { token: admin.token });
    assert.equal(adminRes.status, 200);
    assert.equal(adminRes.data.data.stats.totalStudents, 2);
    assert.equal(adminRes.data.data.stats.totalEvents, 2);
    assert.equal(adminRes.data.data.stats.totalRegistrations, 2);
    assert.equal(adminRes.data.data.stats.attendanceOverview.present, 1);
    assert.equal(adminRes.data.data.stats.attendanceOverview.absent, 1);
    assert.equal(adminRes.data.data.stats.attendanceOverview.rate, 50);
    assert.equal(adminRes.data.data.recentRegistrations.length, 2);
    assert.equal(adminRes.data.data.notifications.length, 1);

    // Ensure no sensitive password field is ever returned
    const serialized = JSON.stringify(adminRes.data);
    assert.equal(serialized.includes('password'), false);
  });

  it('3. Enforces role boundaries on dashboard endpoints', async () => {
    const student = await registerStudent();
    const admin = await registerAdmin();

    const studentTriesAdmin = await api('/admin/dashboard', { token: student.token });
    assert.equal(studentTriesAdmin.status, 403);

    const adminTriesStudent = await api('/student/dashboard', { token: admin.token });
    assert.equal(adminTriesStudent.status, 403);
  });
});
