import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Please provide a valid token.', 401);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Authentication required. Please provide a valid token.', 401);
  }

  const decoded = verifyToken(token);

  if (!decoded?.id) {
    throw new AppError('Invalid token payload.', 401);
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  req.user = sanitizeUser(user);
  next();
});

export default authenticate;
