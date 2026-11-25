import User from '../models/User.js';
import { USER_ROLES } from '../constants/roles.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import AppError from '../utils/AppError.js';

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const hashedPassword = await hashPassword(password);

  // Role is always USER for public registration — never accept client-supplied role
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: USER_ROLES.USER,
  });

  const token = signToken(user._id);

  return {
    token,
    user: sanitizeUser(user),
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken(user._id);

  return {
    token,
    user: sanitizeUser(user),
  };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return sanitizeUser(user);
};
