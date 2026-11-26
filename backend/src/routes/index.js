import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import profileRoutes from './profileRoutes.js';
import analyzeRoutes from './analyzeRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';
import { adminRouter, studentRouter } from './dashboardRoutes.js';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the EventHub API',
    version: '1.0.0',
    phase: 2,
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      profile: '/api/profile',
      analyze: '/api/analyze',
      recommendations: '/api/recommendations',
      studentDashboard: '/api/student/dashboard',
      adminDashboard: '/api/admin/dashboard',
    },
  });
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/analyze', analyzeRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/student', studentRouter);
router.use('/admin', adminRouter);

export default router;
