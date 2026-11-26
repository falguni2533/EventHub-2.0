import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Event from '../src/models/Event.js';
import Registration from '../src/models/Registration.js';
import Certificate from '../src/models/Certificate.js';

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
    return { status: response.status, pdfHeader: buf.subarray(0, 5).toString('utf8') };
  }

  const data = await response.json();
  return { status: response.status, data };
};

const registerStudent = async (overrides = {}) => {
  const res = await api('/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Anshika Saraswat',
      email: 'anshika@college.edu',
      password: 'Password123',
      confirmPassword: 'Password123',
      collegeName: 'NIT Campus',
      studentId: 'CS2026-011',
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

describe('Certificate Generation, Verification, PDF & Revocation Integration', () => {
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
      Certificate.deleteMany({}),
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

  it('1. Enforces attendance eligibility, prevents duplicates, supports bulk issuance, PDF stream, public verification & revocation', async () => {
    const presentStu = await registerStudent();
    const absentStu = await registerStudent({
      fullName: 'Vikram Rao',
      email: 'vikram@college.edu',
      studentId: 'CS2026-077',
    });
    const admin = await registerAdmin();

    const event = await Event.create({
      title: 'TechFest 2026',
      category: 'Symposium',
      date: new Date('2026-03-10T10:00:00Z'),
      venue: 'Main Auditorium',
      status: 'completed',
      createdBy: admin.user.id,
    });

    await Registration.create([
      {
        student: presentStu.user.id,
        event: event._id,
        status: 'confirmed',
        passStatus: 'used',
        attendanceStatus: 'present',
        checkedInAt: new Date(),
      },
      {
        student: absentStu.user.id,
        event: event._id,
        status: 'confirmed',
        passStatus: 'active',
        attendanceStatus: 'absent',
      },
    ]);

    // Student cannot generate certificates
    const forbiddenGen = await api(`/admin/certificates/generate/${event._id}`, {
      method: 'POST',
      token: presentStu.token,
    });
    assert.equal(forbiddenGen.status, 403);

    // Absent student single generation rejected with 400
    const absentSingle = await api('/admin/certificates/generate-single', {
      method: 'POST',
      token: admin.token,
      body: { eventId: event._id.toString(), participantId: absentStu.user.id },
    });
    assert.equal(absentSingle.status, 400);

    // Eligible student single generation succeeds
    const singleRes = await api('/admin/certificates/generate-single', {
      method: 'POST',
      token: admin.token,
      body: { eventId: event._id.toString(), participantId: presentStu.user.id },
    });
    assert.equal(singleRes.status, 201);
    const certId = singleRes.data.data.certificateId;
    assert.match(certId, /^EVH-\d{4}-[A-F0-9]{8}$/);

    // Duplicate single generation rejected with 409
    const dupRes = await api('/admin/certificates/generate-single', {
      method: 'POST',
      token: admin.token,
      body: { eventId: event._id.toString(), participantId: presentStu.user.id },
    });
    assert.equal(dupRes.status, 409);

    // Bulk generation skips already issued & absent
    const bulkRes = await api(`/admin/certificates/generate/${event._id}`, {
      method: 'POST',
      token: admin.token,
    });
    assert.equal(bulkRes.status, 201);
    assert.equal(bulkRes.data.summary.eligibleParticipants, 1);
    assert.equal(bulkRes.data.summary.ineligibleParticipants, 1);
    assert.equal(bulkRes.data.summary.alreadyIssued, 1);
    assert.equal(bulkRes.data.summary.certificatesGenerated, 0);

    // Student fetches only own certificates
    const stuCerts = await api('/student/certificates', { token: presentStu.token });
    assert.equal(stuCerts.status, 200);
    assert.equal(stuCerts.data.count, 1);
    assert.equal(stuCerts.data.data[0].certificateId, certId);

    const absentCerts = await api('/student/certificates', { token: absentStu.token });
    assert.equal(absentCerts.status, 200);
    assert.equal(absentCerts.data.count, 0);

    // Public verification omits private email
    const verifyValid = await api(`/certificates/verify/${certId}`);
    assert.equal(verifyValid.status, 200);
    assert.equal(verifyValid.data.valid, true);
    assert.equal(verifyValid.data.data.participantEmail, undefined);
    assert.equal(JSON.stringify(verifyValid.data).includes('anshika@college.edu'), false);

    // PDF download returns %PDF-
    const pdfRes = await api(`/certificates/download/${certId}`);
    assert.equal(pdfRes.status, 200);
    assert.equal(pdfRes.pdfHeader, '%PDF-');

    // Unknown ID returns 404
    const notFoundRes = await api('/certificates/verify/EVH-FAKE-00000000');
    assert.equal(notFoundRes.status, 404);

    // Revocation updates status & reflects in public verify
    const revokeRes = await api(`/admin/certificates/revoke/${certId}`, {
      method: 'PATCH',
      token: admin.token,
      body: { reason: 'Audit check failure' },
    });
    assert.equal(revokeRes.status, 200);
    assert.equal(revokeRes.data.data.status, 'revoked');

    const verifyRevoked = await api(`/certificates/verify/${certId}`);
    assert.equal(verifyRevoked.status, 200);
    assert.equal(verifyRevoked.data.valid, false);
    assert.equal(verifyRevoked.data.status, 'revoked');
    assert.equal(verifyRevoked.data.data.revocationReason, 'Audit check failure');
  });
});
