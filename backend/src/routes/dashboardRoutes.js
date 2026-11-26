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
  getTeamEvents,
  getTeamOverview,
  createTeam,
  recommendMembers,
  sendInvite,
  setLooking,
  clearLooking,
  recommendTeams,
  sendJoinRequest,
  respondRequest,
} from '../controllers/teamController.js';

// ---------- Student Routes ----------
export const studentRouter = Router();

studentRouter.use(protect, authorizeRoles('student'));

studentRouter.get('/dashboard', getStudentDashboard);

// Student Profile Routes
studentRouter.put('/profile/onboarding', putStudentOnboarding);
studentRouter.patch('/profile', patchStudentProfile);

// Team Up (fixed paths first, then the /:teamId paths)
studentRouter.get('/team', getTeamOverview);
studentRouter.get('/team/events', getTeamEvents);
studentRouter.post('/team', createTeam);
studentRouter.post('/team/looking', setLooking);
studentRouter.delete('/team/looking/:eventId', clearLooking);
studentRouter.get('/team/recommended-teams', recommendTeams);
studentRouter.patch('/team/requests/:requestId', respondRequest);
studentRouter.get('/team/:teamId/recommendations', recommendMembers);
studentRouter.post('/team/:teamId/invite', sendInvite);
studentRouter.post('/team/:teamId/join', sendJoinRequest);

// ---------- Admin Routes ----------
export const adminRouter = Router();

adminRouter.use(protect, authorizeRoles('admin'));

adminRouter.get('/dashboard', getAdminDashboard);

// Admin Profile Routes
adminRouter.patch('/profile', patchAdminProfile);
