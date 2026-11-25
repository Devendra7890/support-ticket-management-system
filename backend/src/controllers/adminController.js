import asyncHandler from '../utils/asyncHandler.js';

/**
 * Lightweight admin-only probe used for authorization testing in Phase 3.
 * Ticket management APIs belong to later phases.
 */
export const adminCheck = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted',
    data: {
      user: req.user,
    },
  });
});
