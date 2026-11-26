import {
  getAdminAttendanceDashboard,
  getStudentAttendanceDashboard,
} from '../services/attendanceService.js';

/**
 * GET /api/admin/attendance/analytics
 */
export const getAdminAttendanceAnalytics = async (req, res, next) => {
  try {
    const data = await getAdminAttendanceDashboard({
      eventId: req.query?.eventId,
      date: req.query?.date,
      status: req.query?.status,
      search: req.query?.search,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/attendance  (and /api/attendance/my)
 */
export const getStudentAttendance = async (req, res, next) => {
  try {
    const data = await getStudentAttendanceDashboard(req.user.id, {
      eventId: req.query?.eventId,
      date: req.query?.date,
      status: req.query?.status,
      search: req.query?.search,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
