import {
  changeUserPassword,
  completeStudentOnboarding,
  getMyProfile,
  updateAdminProfile,
  updateProfilePicture,
  updateStudentProfile,
} from '../services/profileService.js';

/**
 * GET /api/profile/me
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await getMyProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/profile/picture
 */
export const patchProfilePicture = async (req, res, next) => {
  try {
    const user = await updateProfilePicture(req.user.id, req.body?.profilePicture);
    res.status(200).json({
      success: true,
      message: user.profilePicture
        ? 'Profile picture updated successfully'
        : 'Profile picture removed',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/profile/password
 */
export const patchPassword = async (req, res, next) => {
  try {
    await changeUserPassword(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/student/profile/onboarding
 */
export const putStudentOnboarding = async (req, res, next) => {
  try {
    const user = await completeStudentOnboarding(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Student onboarding completed successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/student/profile
 */
export const patchStudentProfile = async (req, res, next) => {
  try {
    const user = await updateStudentProfile(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/profile
 */
export const patchAdminProfile = async (req, res, next) => {
  try {
    const user = await updateAdminProfile(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Admin profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
