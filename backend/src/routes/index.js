import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import { adminRouter, studentRouter } from './dashboardRoutes.js';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the EventHub API',
    version: '1.0.0',
    phase: 1,
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      studentDashboard: '/api/student/dashboard',
      adminDashboard: '/api/admin/dashboard',
    },
  });
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/student', studentRouter);
router.use('/admin', adminRouter);

export default router;
