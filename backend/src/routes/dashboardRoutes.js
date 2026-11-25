import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  getAdminDashboard,
  getStudentDashboard,
} from '../controllers/dashboardController.js';

export const studentRouter = Router();
studentRouter.use(protect, authorizeRoles('student'));

studentRouter.get('/dashboard', getStudentDashboard);

export const adminRouter = Router();
adminRouter.use(protect, authorizeRoles('admin'));

adminRouter.get('/dashboard', getAdminDashboard);
