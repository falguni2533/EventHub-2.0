import User from '../models/User.js';
import { AppError } from './errorHandler.js';
import { sanitizeUser, verifyToken } from '../services/authService.js';

/**
 * Verifies the Bearer JWT from Authorization header and attaches req.user.
 */
export const protect = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return next(new AppError('Authentication token is missing.', 401));
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (_err) {
      return next(new AppError('Invalid or expired authentication token.', 401));
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return next(new AppError('User account no longer exists.', 401));
    }

    req.user = sanitizeUser(user);
    return next();
  } catch (error) {
    return next(error);
  }
};
