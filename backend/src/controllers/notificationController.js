import * as notificationService from '../services/notificationService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listUserNotifications(
    req.user.id,
    req.validatedQuery
  );

  res.status(200).json({
    success: true,
    message: 'Notifications retrieved successfully',
    data: result,
  });
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: { notification },
  });
});

export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsRead(req.user.id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    data: result,
  });
});
