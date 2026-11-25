import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const requireJwtSecret = () => {
  if (!env.jwtSecret) {
    throw new AppError('JWT_SECRET is not configured on the server', 500);
  }
  return env.jwtSecret;
};

const safeEquals = (a, b) => {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Converts a Mongoose User document into a safe public object without password hashes.
 */
export const sanitizeUser = (user) => ({
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  collegeName: user.collegeName,
  studentId: user.studentId,
  role: user.role,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

/**
 * Generates a signed JWT for an authenticated user.
 */
export const generateToken = (user) => {
  const secret = requireJwtSecret();
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    secret,
    { expiresIn: env.jwtExpiresIn }
  );
};

/**
 * Verifies a JWT string and returns the decoded payload.
 */
export const verifyToken = (token) => {
  const secret = requireJwtSecret();
  return jwt.verify(token, secret);
};

/**
 * Determines the role securely without trusting raw client role claims.
 * Public registrations default to 'student'. Creating an 'admin' requires
 * a valid ADMIN_SETUP_KEY configured on the server.
 */
const resolveRegistrationRole = (requestedRole, adminSetupKey) => {
  if (!requestedRole || requestedRole === 'student') {
    return 'student';
  }

  if (requestedRole === 'admin') {
    if (!env.adminSetupKey) {
      throw new AppError(
        'Admin registration via web signup is disabled. Use the admin seed script.',
        403
      );
    }

    if (!safeEquals(adminSetupKey, env.adminSetupKey)) {
      throw new AppError(
        'Invalid admin setup key. Public registration is restricted to students.',
        403
      );
    }

    return 'admin';
  }

  throw new AppError('Invalid role specified', 400);
};

/**
 * Registers a new student (or verified initial admin) and returns user + JWT.
 */
export const registerUser = async (payload) => {
  const {
    fullName,
    email,
    password,
    confirmPassword,
    collegeName,
    studentId,
    role,
    adminSetupKey,
  } = payload || {};

  if (!fullName || !email || !password || !confirmPassword || !collegeName || !studentId) {
    throw new AppError(
      'All fields (fullName, email, password, confirmPassword, collegeName, studentId) are required',
      400
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new AppError('Please enter a valid email address', 400);
  }

  if (password !== confirmPassword) {
    throw new AppError('Password and confirm password do not match', 400);
  }

  if (!PASSWORD_POLICY_REGEX.test(password)) {
    throw new AppError(
      'Password must be at least 8 characters and include uppercase, lowercase, and a number',
      400
    );
  }

  const assignedRole = resolveRegistrationRole(role, adminSetupKey);

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await User.create({
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    password,
    collegeName: String(collegeName).trim(),
    studentId: String(studentId).trim(),
    role: assignedRole,
    lastLoginAt: new Date(),
  });

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token,
  };
};

/**
 * Authenticates a user with email and password and returns user + JWT.
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token,
  };
};
