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

const sampleOnboarding = {
  techInterests: ['Web Development', 'Artificial Intelligence & Machine Learning'],
  programmingLanguages: ['JavaScript', 'Python', 'Other'],
  otherProgrammingLanguage: 'Rust',
  frameworksAndTools: ['React.js', 'Node.js', 'MongoDB', 'Git & GitHub'],
  codingProficiency: 'Intermediate',
  projectExperience: 'Participated in hackathons',
  preferredRoles: ['Full Stack Developer', 'AI/ML Developer'],
  softSkills: ['Problem Solving', 'Teamwork', 'Communication'],
  projectPreferences: ['Web Applications', 'AI-Based Projects', 'Hackathon Projects'],
};

const registerStudent = async (overrides = {}) => {
  const res = await api('/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Meera Nair',
      email: 'meera@college.edu',
      password: 'Password123',
      confirmPassword: 'Password123',
      collegeName: 'NIT Campus',
      studentId: 'CS2026-108',
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

describe('Phase 2 Student & Admin Profile API', () => {
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

  it('1. Registers new student with profileCompleted=false and saves all 8 onboarding answers persistently', async () => {
    const reg = await registerStudent();
    assert.equal(reg.user.profileCompleted, false);

    // Reject incomplete questionnaire payload
    const badRes = await api('/student/profile/onboarding', {
      method: 'PUT',
      token: reg.token,
      body: { onboarding: { techInterests: [] } },
    });
    assert.equal(badRes.status, 400);

    // Submit valid 8-question onboarding
    const completeRes = await api('/student/profile/onboarding', {
      method: 'PUT',
      token: reg.token,
      body: { onboarding: sampleOnboarding },
    });
    assert.equal(completeRes.status, 200);
    assert.equal(completeRes.data.data.user.profileCompleted, true);
    assert.deepEqual(
      completeRes.data.data.user.onboarding.techInterests,
      sampleOnboarding.techInterests
    );
    assert.equal(
      completeRes.data.data.user.onboarding.otherProgrammingLanguage,
      'Rust'
    );

    // Verify persistence across fresh login
    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: { email: 'meera@college.edu', password: 'Password123' },
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.data.data.user.profileCompleted, true);
    assert.equal(loginRes.data.data.user.onboarding.codingProficiency, 'Intermediate');
    assert.equal(loginRes.data.data.user.password, undefined);
  });

  it('2. Allows students to update personal info, social links, avatar, and questionnaire answers', async () => {
    const reg = await registerStudent();
    await api('/student/profile/onboarding', {
      method: 'PUT',
      token: reg.token,
      body: { onboarding: sampleOnboarding },
    });

    const tinyPngDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

    const picRes = await api('/profile/picture', {
      method: 'PATCH',
      token: reg.token,
      body: { profilePicture: tinyPngDataUrl },
    });
    assert.equal(picRes.status, 200);
    assert.equal(picRes.data.data.user.profilePicture, tinyPngDataUrl);

    const patchRes = await api('/student/profile', {
      method: 'PATCH',
      token: reg.token,
      body: {
        course: 'B.Tech CSE',
        year: '3rd Year',
        bio: 'Building full-stack AI tools for campus events.',
        socialLinks: {
          github: 'https://github.com/meeranair',
          linkedin: 'https://linkedin.com/in/meeranair',
        },
        onboarding: {
          ...sampleOnboarding,
          codingProficiency: 'Advanced',
        },
      },
    });

    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.data.data.user.course, 'B.Tech CSE');
    assert.equal(patchRes.data.data.user.year, '3rd Year');
    assert.equal(patchRes.data.data.user.socialLinks.github, 'https://github.com/meeranair');
    assert.equal(patchRes.data.data.user.onboarding.codingProficiency, 'Advanced');

    const meRes = await api('/profile/me', { token: reg.token });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.data.data.user.profilePicture, tinyPngDataUrl);
  });

  it('3. Allows admins to view/edit own profile, update picture, and change password', async () => {
    const admin = await registerAdmin();

    const updateRes = await api('/admin/profile', {
      method: 'PATCH',
      token: admin.token,
      body: {
        fullName: 'Dr. Kavya Nair',
        designation: 'Chief Event Coordinator',
        department: 'Student Affairs',
      },
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.data.user.fullName, 'Dr. Kavya Nair');
    assert.equal(updateRes.data.data.user.designation, 'Chief Event Coordinator');
    assert.equal(updateRes.data.data.user.department, 'Student Affairs');
    assert.equal(updateRes.data.data.user.accountStatus, 'Active');

    const pwRes = await api('/profile/password', {
      method: 'PATCH',
      token: admin.token,
      body: {
        currentPassword: 'Password123',
        newPassword: 'NewPassword456',
        confirmNewPassword: 'NewPassword456',
      },
    });
    assert.equal(pwRes.status, 200);

    // Old password rejected, new password succeeds
    const oldLogin = await api('/auth/login', {
      method: 'POST',
      body: { email: 'admin@college.edu', password: 'Password123' },
    });
    assert.equal(oldLogin.status, 401);

    const newLogin = await api('/auth/login', {
      method: 'POST',
      body: { email: 'admin@college.edu', password: 'NewPassword456' },
    });
    assert.equal(newLogin.status, 200);
    assert.equal(newLogin.data.data.user.department, 'Student Affairs');
    assert.equal(newLogin.data.data.user.password, undefined);
  });

  it('4. Enforces strict student/admin authorization boundaries on profile endpoints', async () => {
    const student = await registerStudent();
    const admin = await registerAdmin();

    const unauth = await api('/profile/me');
    assert.equal(unauth.status, 401);

    const studentOnAdmin = await api('/admin/profile', {
      method: 'PATCH',
      token: student.token,
      body: { department: 'Hacked' },
    });
    assert.equal(studentOnAdmin.status, 403);

    const adminOnStudentOnboarding = await api('/student/profile/onboarding', {
      method: 'PUT',
      token: admin.token,
      body: { onboarding: sampleOnboarding },
    });
    assert.equal(adminOnStudentOnboarding.status, 403);

    const adminOnStudentPatch = await api('/student/profile', {
      method: 'PATCH',
      token: admin.token,
      body: { bio: 'Invalid' },
    });
    assert.equal(adminOnStudentPatch.status, 403);
  });
});
