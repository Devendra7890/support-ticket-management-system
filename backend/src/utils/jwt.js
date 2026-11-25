import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import AppError from './AppError.js';

export const signToken = (userId) => {
  return jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired. Please log in again.', 401);
    }

    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token. Please log in again.', 401);
    }

    throw new AppError('Authentication failed.', 401);
  }
};

/**
 * Signs a short-lived token for automated expiry testing.
 * Not used by production auth flows.
 */
export const signTokenWithExpiry = (userId, expiresIn) => {
  return jwt.sign({ id: userId }, env.jwtSecret, { expiresIn });
};
