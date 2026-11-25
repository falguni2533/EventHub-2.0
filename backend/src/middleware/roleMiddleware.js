import { AppError } from './errorHandler.js';

/**
 * Restricts route access to users matching one of the allowed roles.
 */
export const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new AppError(
        `Access denied. This resource requires one of the following roles: ${allowedRoles.join(', ')}.`,
        403
      )
    );
  }

  return next();
};
