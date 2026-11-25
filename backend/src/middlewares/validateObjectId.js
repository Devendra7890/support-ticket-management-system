import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];

  if (!mongoose.Types.ObjectId.isValid(value)) {
    return next(new AppError(`Invalid ${paramName}: must be a valid MongoDB ObjectId.`, 400));
  }

  return next();
};

export default validateObjectId;
