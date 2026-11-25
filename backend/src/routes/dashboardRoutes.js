import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

export const studentRouter = Router();
studentRouter.use(protect, authorizeRoles('student'));

studentRouter.get('/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      panel: 'student',
      user: req.user,
      allowedSections: [
        'Dashboard',
        'Events',
        'Registrations',
        'My Passes',
        'My Team',
        'Attendance',
        'My Profile',
      ],
    },
  });
});

export const adminRouter = Router();
adminRouter.use(protect, authorizeRoles('admin'));

adminRouter.get('/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      panel: 'admin',
      user: req.user,
      capabilities: [
        'Manage Events (Upcoming Phase)',
        'View Student Registrations (Upcoming Phase)',
        'Manage Attendance (Upcoming Phase)',
        'Administrative Controls',
      ],
    },
  });
});
