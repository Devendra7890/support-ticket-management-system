import AppError from '../utils/AppError.js';

/**
 * Restricts access to users whose DB-backed role is included in allowedRoles.
 * Must be used after authenticate middleware.
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new AppError('You do not have permission to perform this action.', 403)
    );
  }

  return next();
};

export default authorize;
