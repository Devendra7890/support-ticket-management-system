import * as activityLogService from '../services/activityLogService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getTicketActivity = asyncHandler(async (req, res) => {
  const result = await activityLogService.listTicketActivity(
    req.params.id,
    req.user,
    req.validatedQuery
  );

  res.status(200).json({
    success: true,
    message: 'Ticket activity retrieved successfully',
    data: result,
  });
});
