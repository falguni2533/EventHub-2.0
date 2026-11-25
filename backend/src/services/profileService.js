import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { PASSWORD_POLICY_REGEX, sanitizeUser } from './authService.js';
import {
  CODING_PROFICIENCY_OPTIONS,
  FRAMEWORK_TOOL_OPTIONS,
  PROGRAMMING_LANGUAGE_OPTIONS,
  PROJECT_EXPERIENCE_OPTIONS,
  PROJECT_PREFERENCE_OPTIONS,
  SOFT_SKILL_OPTIONS,
  TEAM_ROLE_OPTIONS,
  TECH_INTEREST_OPTIONS,
} from '../constants/onboardingOptions.js';

const DATA_IMAGE_REGEX = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i;
const MAX_PICTURE_LENGTH = 450_000;

const validateProfilePicture = (value) => {
  if (value === undefined) return undefined;
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.length > MAX_PICTURE_LENGTH) {
    throw new AppError('Profile picture is too large. Please upload a smaller image (under 300 KB).', 400);
  }
  if (DATA_IMAGE_REGEX.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
  } catch {}
  throw new AppError('Profile picture must be a valid PNG, JPG, or WebP image.', 400);
};

const validateSocialUrl = (value, label) => {
  if (value === undefined) return undefined;
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Invalid protocol');
    }
    return trimmed;
  } catch {
    throw new AppError(`Please enter a valid ${label} URL (including https://).`, 400);
  }
};

const validateMultiChoice = (values, allowedOptions, fieldLabel) => {
  if (!Array.isArray(values)) {
    throw new AppError(`${fieldLabel} must be a list of selections.`, 400);
  }
  const unique = [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
  if (unique.length === 0) {
    throw new AppError(`Please select at least one option for ${fieldLabel}.`, 400);
  }
  const invalid = unique.filter((item) => !allowedOptions.includes(item));
  if (invalid.length > 0) {
    throw new AppError(`Invalid selection in ${fieldLabel}: ${invalid.join(', ')}`, 400);
  }
  return unique;
};

const validateSingleChoice = (value, allowedOptions, fieldLabel) => {
  const normalized = String(value || '').trim();
  if (!normalized || !allowedOptions.includes(normalized)) {
    throw new AppError(`Please select a valid option for ${fieldLabel}.`, 400);
  }
  return normalized;
};

const validateOnboardingAnswers = (answers = {}) => {
  const techInterests = validateMultiChoice(answers.techInterests, TECH_INTEREST_OPTIONS, 'Areas of technology interest');
  const programmingLanguages = validateMultiChoice(answers.programmingLanguages, PROGRAMMING_LANGUAGE_OPTIONS, 'Programming languages');
  const frameworksAndTools = validateMultiChoice(answers.frameworksAndTools, FRAMEWORK_TOOL_OPTIONS, 'Technologies and frameworks');
  const codingProficiency = validateSingleChoice(answers.codingProficiency, CODING_PROFICIENCY_OPTIONS, 'Overall coding proficiency');
  const projectExperience = validateSingleChoice(answers.projectExperience, PROJECT_EXPERIENCE_OPTIONS, 'Project experience');
  const preferredRoles = validateMultiChoice(answers.preferredRoles, TEAM_ROLE_OPTIONS, 'Preferred team role');
  const softSkills = validateMultiChoice(answers.softSkills, SOFT_SKILL_OPTIONS, 'Strongest soft skills');
  const projectPreferences = validateMultiChoice(answers.projectPreferences, PROJECT_PREFERENCE_OPTIONS, 'Project preferences');
  return {
    techInterests,
    programmingLanguages,
    otherProgrammingLanguage: programmingLanguages.includes('Other') ? String(answers.otherProgrammingLanguage || '').trim().slice(0, 80) : '',
    frameworksAndTools,
    otherFramework: frameworksAndTools.includes('Other') ? String(answers.otherFramework || '').trim().slice(0, 80) : '',
    codingProficiency,
    projectExperience,
    preferredRoles,
    softSkills,
    projectPreferences,
  };
};

const findUserOrThrow = async (userId, selectPassword = false) => {
  const query = User.findById(userId);
  if (selectPassword) query.select('+password');
  const user = await query;
  if (!user) {
    throw new AppError('User account not found.', 404);
  }
  return user;
};

export const getMyProfile = async (userId) => {
  const user = await findUserOrThrow(userId);
  return sanitizeUser(user);
};

export const getUserById = async (userId) => {
  const user = await findUserOrThrow(userId);
  return sanitizeUser(user);
};

export const completeStudentOnboarding = async (userId, payload = {}) => {
  const user = await findUserOrThrow(userId);
  if (user.role !== 'student') {
    throw new AppError('Student onboarding is restricted to student accounts.', 403);
  }
  const onboardingData = validateOnboardingAnswers(payload.onboarding || payload);
  user.onboarding = onboardingData;
  if (payload.course !== undefined) {
    user.course = String(payload.course || '').trim();
  }
  if (payload.year !== undefined) {
    user.year = String(payload.year || '').trim();
  }
  if (payload.bio !== undefined) {
    user.bio = String(payload.bio || '').trim();
  }
  if (payload.profilePicture !== undefined) {
    user.profilePicture = validateProfilePicture(payload.profilePicture);
  }
  if (payload.socialLinks) {
    user.socialLinks = {
      github: validateSocialUrl(payload.socialLinks.github, 'GitHub') ?? user.socialLinks?.github ?? '',
      linkedin: validateSocialUrl(payload.socialLinks.linkedin, 'LinkedIn') ?? user.socialLinks?.linkedin ?? '',
    };
  }
  user.profileCompleted = true;
  if (!user.profileCompletedAt) {
    user.profileCompletedAt = new Date();
  }
  await user.save();
  return sanitizeUser(user);
};

export const updateStudentProfile = async (userId, payload = {}) => {
  const user = await findUserOrThrow(userId);
  if (user.role !== 'student') {
    throw new AppError('This endpoint is restricted to student accounts.', 403);
  }
  if (payload.fullName !== undefined) {
    const trimmedName = String(payload.fullName).trim();
    if (trimmedName.length < 2) {
      throw new AppError('Full name must be at least 2 characters.', 400);
    }
    user.fullName = trimmedName;
  }
  if (payload.collegeName !== undefined) {
    const trimmedCollege = String(payload.collegeName).trim();
    if (trimmedCollege.length < 2) {
      throw new AppError('College name must be at least 2 characters.', 400);
    }
    user.collegeName = trimmedCollege;
  }
  if (payload.studentId !== undefined) {
    const trimmedId = String(payload.studentId).trim();
    if (trimmedId.length < 2) {
      throw new AppError('Student ID must be at least 2 characters.', 400);
    }
    user.studentId = trimmedId;
  }
  if (payload.course !== undefined) {
    user.course = String(payload.course || '').trim();
  }
  if (payload.year !== undefined) {
    user.year = String(payload.year || '').trim();
  }
  if (payload.bio !== undefined) {
    user.bio = String(payload.bio || '').trim();
  }
  if (payload.profilePicture !== undefined) {
    user.profilePicture = validateProfilePicture(payload.profilePicture);
  }
  if (payload.socialLinks !== undefined) {
    const nextGithub = payload.socialLinks?.github !== undefined ? validateSocialUrl(payload.socialLinks.github, 'GitHub') : user.socialLinks?.github || '';
    const nextLinkedin = payload.socialLinks?.linkedin !== undefined ? validateSocialUrl(payload.socialLinks.linkedin, 'LinkedIn') : user.socialLinks?.linkedin || '';
    user.socialLinks = { github: nextGithub, linkedin: nextLinkedin };
  }
  if (payload.onboarding !== undefined) {
    user.onboarding = validateOnboardingAnswers(payload.onboarding);
    user.profileCompleted = true;
    if (!user.profileCompletedAt) {
      user.profileCompletedAt = new Date();
    }
  }
  await user.save();
  return sanitizeUser(user);
};

export const updateAdminProfile = async (userId, payload = {}) => {
  const user = await findUserOrThrow(userId);
  if (user.role !== 'admin') {
    throw new AppError('This endpoint is restricted to administrator accounts.', 403);
  }
  if (payload.fullName !== undefined) {
    const trimmedName = String(payload.fullName).trim();
    if (trimmedName.length < 2) {
      throw new AppError('Full name must be at least 2 characters.', 400);
    }
    user.fullName = trimmedName;
  }
  if (payload.designation !== undefined) {
    const trimmedDesignation = String(payload.designation).trim();
    user.designation = trimmedDesignation || 'Admin';
  }
  if (payload.department !== undefined) {
    user.department = String(payload.department || '').trim();
  }
  if (payload.profilePicture !== undefined) {
    user.profilePicture = validateProfilePicture(payload.profilePicture);
  }
  await user.save();
  return sanitizeUser(user);
};

export const updateProfilePicture = async (userId, profilePicture) => {
  if (profilePicture === undefined) {
    throw new AppError('Profile picture payload is required.', 400);
  }
  const user = await findUserOrThrow(userId);
  user.profilePicture = validateProfilePicture(profilePicture);
  await user.save();
  return sanitizeUser(user);
};

export const changeUserPassword = async (userId, { currentPassword, newPassword, confirmNewPassword } = {}) => {
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new AppError('Current password, new password, and confirm new password are required.', 400);
  }
  if (newPassword !== confirmNewPassword) {
    throw new AppError('New password and confirmation do not match.', 400);
  }
  if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
    throw new AppError('New password must be at least 8 characters and include uppercase, lowercase, and a number.', 400);
  }
  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from your current password.', 400);
  }
  const user = await findUserOrThrow(userId, true);
  const isCurrentValid = await user.comparePassword(currentPassword);
  if (!isCurrentValid) {
    throw new AppError('Current password is incorrect.', 401);
  }
  user.password = newPassword;
  await user.save();
  return sanitizeUser(user);
};
