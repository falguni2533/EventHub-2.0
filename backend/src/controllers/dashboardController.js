import {
  getAdminDashboardData,
  getStudentDashboardData,
} from '../services/dashboardService.js';

/**
 * GET /api/student/dashboard
 */
export const getStudentDashboard = async (req, res, next) => {
  try {
    const data = await getStudentDashboardData(req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/dashboard
 */
export const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await getAdminDashboardData(req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
