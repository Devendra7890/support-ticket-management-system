import Notification from '../models/Notification.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { USER_ROLES } from '../constants/roles.js';
import AppError from '../utils/AppError.js';
import {
  buildPaginationMeta,
  buildStableSort,
} from '../utils/pagination.js';

/**
 * Attach ticket availability for UI without deleting retained notifications.
 * Deleted tickets keep the notification; `ticket.available` is false.
 */
const enrichNotificationsWithTicketAvailability = async (notifications) => {
  const plain = notifications.map((note) =>
    typeof note.toObject === 'function' ? note.toObject() : { ...note }
  );

  const ticketIds = [
    ...new Set(
      plain
        .map((note) => note.ticket)
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];

  if (ticketIds.length === 0) {
    return plain.map((note) => ({
      ...note,
      ticket: note.ticket
        ? { _id: String(note.ticket), available: false }
        : null,
    }));
  }

  const existingTickets = await Ticket.find({ _id: { $in: ticketIds } })
    .select('_id title')
    .lean();
  const ticketMap = new Map(
    existingTickets.map((ticket) => [String(ticket._id), ticket])
  );

  return plain.map((note) => {
    if (!note.ticket) {
      return { ...note, ticket: null };
    }

    const ticketId = String(note.ticket);
    const existing = ticketMap.get(ticketId);

    return {
      ...note,
      ticket: {
        _id: ticketId,
        title: existing?.title,
        available: Boolean(existing),
      },
    };
  });
};

export const createNotification = async ({
  recipientId,
  ticketId,
  message,
  type,
}) => {
  if (!recipientId || !ticketId || !message || !type) {
    throw new Error('Notification requires recipientId, ticketId, message, and type');
  }

  return Notification.create({
    recipient: recipientId,
    ticket: ticketId,
    message,
    type,
  });
};

export const notifyUsers = async ({ recipientIds, ticketId, message, type, excludeUserId }) => {
  const uniqueIds = [...new Set(recipientIds.map((id) => String(id)))]
    .filter((id) => id && id !== String(excludeUserId));

  if (uniqueIds.length === 0) {
    return [];
  }

  const docs = uniqueIds.map((recipientId) => ({
    recipient: recipientId,
    ticket: ticketId,
    message,
    type,
  }));

  return Notification.insertMany(docs, { ordered: false });
};

export const getAdminRecipientIds = async () => {
  const admins = await User.find({ role: USER_ROLES.ADMIN }).select('_id');
  return admins.map((admin) => admin._id);
};

export const listUserNotifications = async (userId, query) => {
  const { page, limit, isRead } = query;
  const filter = { recipient: userId };

  if (typeof isRead === 'boolean') {
    filter.isRead = isRead;
  }

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort(buildStableSort('createdAt', 'desc'))
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
  ]);

  const enriched = await enrichNotificationsWithTicketAvailability(notifications);

  return {
    notifications: enriched,
    pagination: buildPaginationMeta({ total, page, limit }),
  };
};

export const markNotificationRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true } },
    { returnDocument: 'after' }
  );

  if (!notification) {
    throw new AppError('Notification not found.', 404);
  }

  return notification;
};

export const markAllNotificationsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};
