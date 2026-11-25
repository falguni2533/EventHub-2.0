
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

// Student Routes
export const studentRouter = Router();

studentRouter.use(protect, authorizeRoles('student'));

studentRouter.get('/dashboard', getStudentDashboard);

// Student Profile Routes
studentRouter.put('/profile/onboarding', putStudentOnboarding);
studentRouter.patch('/profile', patchStudentProfile);


// Admin Routes
export const adminRouter = Router();

adminRouter.use(protect, authorizeRoles('admin'));

adminRouter.get('/dashboard', getAdminDashboard);

// Admin Profile Routes
adminRouter.patch('/profile', patchAdminProfile);
