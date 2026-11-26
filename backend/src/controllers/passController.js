import {
  buildStudentPassPDF,
  checkInEventPass,
  getAdminAttendanceOverview,
  listStudentPasses,
  verifyEventPass,
} from '../services/passService.js';

/**
 * GET /api/student/passes
 */
export const getMyPasses = async (req, res, next) => {
  try {
    const data = await listStudentPasses(req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/passes/:registrationId/download
 */
export const downloadMyPass = async (req, res, next) => {
  try {
    const { filename, doc } = await buildStudentPassPDF(
      req.params.registrationId,
      req.user.id
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/passes/verify
 */
export const verifyPass = async (req, res, next) => {
  try {
    const result = await verifyEventPass({
      token: req.body?.token,
      eventId: req.body?.eventId,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/passes/check-in
 */
export const checkInPass = async (req, res, next) => {
  try {
    const result = await checkInEventPass(
      {
        token: req.body?.token,
        eventId: req.body?.eventId,
      },
      req.user.id
    );
    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/attendance
 */
export const getAttendanceOverview = async (req, res, next) => {
  try {
    const data = await getAdminAttendanceOverview(req.query?.eventId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
