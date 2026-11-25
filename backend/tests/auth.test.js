import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';

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

const studentPayload = {
  fullName: 'Aarav Sharma',
  email: 'aarav@college.edu',
  password: 'Password123',
  confirmPassword: 'Password123',
  collegeName: 'NIT Campus',
  studentId: 'CS2026-042',
};

describe('Phase 1 Authentication & Role-Based Access Control', () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        launchTimeout: 60000,
      },
    });
    await mongoose.connect(mongoServer.getUri());
    httpServer = app.listen(0);
    await new Promise((resolve) => httpServer.once('listening', resolve));
    const { port } = httpServer.address();
    baseUrl = `http://localhost:${port}/api`;
  }, { timeout: 90000 });

  beforeEach(async () => {
    await User.deleteMany({});
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

  it('1. Registers a student successfully without exposing password hash', async () => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: studentPayload,
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.equal(res.data.data.user.email, 'aarav@college.edu');
    assert.equal(res.data.data.user.role, 'student');
    assert.equal(res.data.data.user.password, undefined);
    assert.ok(res.data.data.token);

    const saved = await User.findOne({ email: 'aarav@college.edu' }).select('+password');
    assert.ok(saved);
    assert.notEqual(saved.password, studentPayload.password);
    assert.ok(saved.password.startsWith('$2'));
  });

  it('2. Rejects duplicate email registration with 409', async () => {
    await api('/auth/register', { method: 'POST', body: studentPayload });
    const duplicate = await api('/auth/register', {
      method: 'POST',
      body: studentPayload,
    });

    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.data.success, false);
  });

  it('3 & 4. Logs in with valid credentials and rejects incorrect password', async () => {
    await api('/auth/register', { method: 'POST', body: studentPayload });

    const validLogin = await api('/auth/login', {
      method: 'POST',
      body: { email: studentPayload.email, password: studentPayload.password },
    });
    assert.equal(validLogin.status, 200);
    assert.equal(validLogin.data.data.user.role, 'student');
    assert.equal(validLogin.data.data.user.password, undefined);
    assert.ok(validLogin.data.data.token);

    const wrongPassword = await api('/auth/login', {
      method: 'POST',
      body: { email: studentPayload.email, password: 'WrongPassword123' },
    });
    assert.equal(wrongPassword.status, 401);
    assert.equal(wrongPassword.data.success, false);
  });

  it('5. Rejects unverified public admin registration and allows verified admin setup', async () => {
    const blockedAdmin = await api('/auth/register', {
      method: 'POST',
      body: {
        ...studentPayload,
        email: 'hacker@college.edu',
        role: 'admin',
      },
    });
    assert.equal(blockedAdmin.status, 403);

    const validAdmin = await api('/auth/register', {
      method: 'POST',
      body: {
        ...studentPayload,
        fullName: 'Campus Admin',
        email: 'admin@college.edu',
        studentId: 'ADMIN-001',
        role: 'admin',
        adminSetupKey: process.env.ADMIN_SETUP_KEY,
      },
    });
    assert.equal(validAdmin.status, 201);
    assert.equal(validAdmin.data.data.user.role, 'admin');
  });

  it('6, 7 & 8. Enforces strict role isolation and rejects unauthorized requests', async () => {
    const unauthMe = await api('/auth/me');
    assert.equal(unauthMe.status, 401);

    const unauthAdmin = await api('/admin/dashboard');
    assert.equal(unauthAdmin.status, 401);

    const studentRes = await api('/auth/register', {
      method: 'POST',
      body: studentPayload,
    });
    const studentToken = studentRes.data.data.token;

    const adminRes = await api('/auth/register', {
      method: 'POST',
      body: {
        ...studentPayload,
        fullName: 'Campus Admin',
        email: 'admin@college.edu',
        studentId: 'ADMIN-001',
        role: 'admin',
        adminSetupKey: process.env.ADMIN_SETUP_KEY,
      },
    });
    const adminToken = adminRes.data.data.token;

    // Student accesses student dashboard, blocked from admin dashboard
    const studentOnStudent = await api('/student/dashboard', { token: studentToken });
    assert.equal(studentOnStudent.status, 200);
    const studentOnAdmin = await api('/admin/dashboard', { token: studentToken });
    assert.equal(studentOnAdmin.status, 403);

    // Admin accesses admin dashboard, blocked from student dashboard
    const adminOnAdmin = await api('/admin/dashboard', { token: adminToken });
    assert.equal(adminOnAdmin.status, 200);
    const adminOnStudent = await api('/student/dashboard', { token: adminToken });
    assert.equal(adminOnStudent.status, 403);
  });

  it('9 & 10. Restores session via /auth/me and logs out cleanly', async () => {
    const reg = await api('/auth/register', {
      method: 'POST',
      body: studentPayload,
    });
    const token = reg.data.data.token;

    const me = await api('/auth/me', { token });
    assert.equal(me.status, 200);
    assert.equal(me.data.data.user.email, studentPayload.email);

    const logoutRes = await api('/auth/logout', { method: 'POST', token });
    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.data.success, true);
  });
});
