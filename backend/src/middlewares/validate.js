import AppError from '../utils/AppError.js';

/**
 * Validates request data with a Zod schema.
 * - body (default): replaces req.body with parsed data
 * - query: stores parsed data on req.validatedQuery (Express 5 query is read-only)
 */
const validate = (schema, property = 'body') => (req, res, next) => {
  const source = property === 'query' ? req.query : req[property];
  const result = schema.safeParse(source);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ');
    return next(new AppError(message, 400));
  }

  if (property === 'query') {
    req.validatedQuery = result.data;
  } else {
    // Replace with parsed/validated data only (prevents mass assignment)
    req[property] = result.data;
  }

  return next();
};

export default validate;
