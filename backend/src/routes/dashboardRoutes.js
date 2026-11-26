
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

import {
  getAdminDashboard,
  getStudentDashboard,
} from '../controllers/dashboardController.js';

import {
  patchAdminProfile,
  patchStudentProfile,
  putStudentOnboarding,
} from '../controllers/profileController.js';

import {
  generateEventCertificates,
  generateSingleCertificate,
  getCertificates,
  getEventsAndParticipants,
  getMyCertificateDetail,
  getMyCertificates,
  revokeCertificate,
} from '../controllers/certificateController.js';

import {
  checkInPass,
  downloadMyPass,
  getAttendanceOverview,
  getMyPasses,
  getMyPastPasses,
  getMyRegistrations,
  getMyUpcomingPasses,
  verifyPass,
} from '../controllers/passController.js';

// Student Routes
export const studentRouter = Router();

studentRouter.use(protect, authorizeRoles('student'));

studentRouter.get('/dashboard', getStudentDashboard);

// Student Profile Routes
studentRouter.put('/profile/onboarding', putStudentOnboarding);
studentRouter.patch('/profile', patchStudentProfile);

// Student Registrations & Passes Routes
studentRouter.get('/registrations', getMyRegistrations);
studentRouter.get('/passes', getMyPasses);
studentRouter.get('/passes/upcoming', getMyUpcomingPasses);
studentRouter.get('/passes/past', getMyPastPasses);
studentRouter.get('/passes/:registrationId/download', downloadMyPass);

// Student Certificates Routes
studentRouter.get('/certificates', getMyCertificates);
studentRouter.get('/certificates/:certificateId', getMyCertificateDetail);

// Admin Routes
export const adminRouter = Router();

adminRouter.use(protect, authorizeRoles('admin'));

adminRouter.get('/dashboard', getAdminDashboard);

// Admin Profile Routes
adminRouter.patch('/profile', patchAdminProfile);

// Admin Pass Verification & Attendance Check-in Routes
adminRouter.get('/attendance', getAttendanceOverview);
adminRouter.post('/passes/verify', verifyPass);
adminRouter.post('/passes/check-in', checkInPass);

// Admin Certificate Management Routes
adminRouter.get('/certificates', getCertificates);
adminRouter.get('/certificates/events', getEventsAndParticipants);
adminRouter.post('/certificates/generate/:eventId', generateEventCertificates);
adminRouter.post('/certificates/generate-single', generateSingleCertificate);
adminRouter.patch('/certificates/revoke/:certificateId', revokeCertificate);
