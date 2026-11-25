import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import { EVENT_TYPES } from '../constants/events.js';
import { USER_ROLES } from '../constants/roles.js';
import { TICKET_STATUSES } from '../constants/ticket.js';
import { NOTIFICATION_TYPES } from '../constants/notifications.js';
import { createActivityLog } from '../services/activityLogService.js';
import {
  getAdminRecipientIds,
  notifyUsers,
} from '../services/notificationService.js';

const getActorName = async (userId) => {
  if (!userId) return 'A user';
  const user = await User.findById(userId).select('name role');
  return user?.name || 'A user';
};

const getActor = async (userId) => {
  if (!userId) return null;
  return User.findById(userId).select('name role');
};

const resolveTicketId = (payload) =>
  payload?.ticketId || payload?.ticket?._id || payload?.ticket?.id || null;

const resolveOwnerId = async (payload) => {
  const createdBy = payload?.ticket?.createdBy;
  if (!createdBy) {
    const ticketId = resolveTicketId(payload);
    if (!ticketId) return null;
    const ticket = await Ticket.findById(ticketId).select('createdBy');
    return ticket?.createdBy || null;
  }

  return createdBy._id || createdBy;
};

const buildTicketSnapshot = (ticket) => {
  if (!ticket) return null;
  const source = typeof ticket.toObject === 'function' ? ticket.toObject() : ticket;
  return {
    id: source._id,
    title: source.title,
    status: source.status,
    priority: source.priority,
    category: source.category,
    createdBy: source.createdBy?._id || source.createdBy,
  };
};

export const handleTicketCreated = async (payload) => {
  const ticketId = resolveTicketId(payload);
  const userId = payload.userId;
  const actorName = await getActorName(userId);

  await createActivityLog({
    ticketId,
    userId,
    eventType: EVENT_TYPES.TICKET_CREATED,
    description: `${actorName} created a new support ticket.`,
    metadata: {
      ticketSnapshot: buildTicketSnapshot(payload.ticket),
    },
  });

  const adminIds = await getAdminRecipientIds();
  await notifyUsers({
    recipientIds: adminIds,
    ticketId,
    message: `${actorName} submitted a new support ticket: "${payload.ticket?.title || 'Untitled'}".`,
    type: NOTIFICATION_TYPES.TICKET_CREATED,
    excludeUserId: userId,
  });
};

export const handleTicketUpdated = async (payload) => {
  const ticketId = resolveTicketId(payload);
  const userId = payload.userId;
  const actor = await getActor(userId);
  const actorName = actor?.name || 'A user';

  const previousPriority = payload.previous?.priority;
  const newPriority = payload.changes?.priority;

  await createActivityLog({
    ticketId,
    userId,
    eventType: EVENT_TYPES.TICKET_UPDATED,
    description:
      previousPriority && newPriority && previousPriority !== newPriority
        ? `${actorName} updated ticket priority from ${previousPriority} to ${newPriority}.`
        : `${actorName} updated the ticket details.`,
    metadata: {
      previous: payload.previous || {},
      changes: payload.changes || {},
      previousPriority,
      newPriority,
      ticketSnapshot: buildTicketSnapshot(payload.ticket),
    },
  });

  // Notify admins only when a normal user updates a ticket
  if (actor?.role === USER_ROLES.USER) {
    const adminIds = await getAdminRecipientIds();
    await notifyUsers({
      recipientIds: adminIds,
      ticketId,
      message: `${actorName} updated ticket "${payload.ticket?.title || 'Untitled'}".`,
      type: NOTIFICATION_TYPES.TICKET_UPDATED,
      excludeUserId: userId,
    });
  }
};

export const handleTicketStatusChanged = async (payload) => {
  const ticketId = resolveTicketId(payload);
  const userId = payload.userId;
  const actorName = await getActorName(userId);
  const previousStatus = payload.previousStatus || payload.transition?.from;
  const newStatus = payload.newStatus || payload.transition?.to;

  await createActivityLog({
    ticketId,
    userId,
    eventType: EVENT_TYPES.TICKET_STATUS_CHANGED,
    description: `${actorName} changed ticket status from ${previousStatus} to ${newStatus}.`,
    metadata: {
      previousStatus,
      newStatus,
      transition: payload.transition,
      ticketSnapshot: buildTicketSnapshot(payload.ticket),
    },
  });

  // Resolution notification is handled exclusively by TICKET_RESOLVED
  if (newStatus === TICKET_STATUSES.RESOLVED) {
    return;
  }

  const ownerId = await resolveOwnerId(payload);
  if (!ownerId) return;

  await notifyUsers({
    recipientIds: [ownerId],
    ticketId,
    message: `Your ticket status changed from ${previousStatus} to ${newStatus}.`,
    type: NOTIFICATION_TYPES.TICKET_STATUS_CHANGED,
    excludeUserId: userId,
  });
};

export const handleTicketResolved = async (payload) => {
  const ticketId = resolveTicketId(payload);
  const userId = payload.userId;
  const actorName = await getActorName(userId);

  await createActivityLog({
    ticketId,
    userId,
    eventType: EVENT_TYPES.TICKET_RESOLVED,
    description: `${actorName} marked the ticket as resolved.`,
    metadata: {
      previousStatus: payload.previousStatus || payload.transition?.from,
      newStatus: TICKET_STATUSES.RESOLVED,
      ticketSnapshot: buildTicketSnapshot(payload.ticket),
    },
  });

  const ownerId = await resolveOwnerId(payload);
  if (!ownerId) return;

  await notifyUsers({
    recipientIds: [ownerId],
    ticketId,
    message: `Your ticket "${payload.ticket?.title || 'Untitled'}" has been resolved.`,
    type: NOTIFICATION_TYPES.TICKET_RESOLVED,
    excludeUserId: userId,
  });
};

export const handleCommentAdded = async (payload) => {
  const ticketId = resolveTicketId(payload);
  const userId = payload.userId;
  const userRole = payload.userRole;
  const actorName = await getActorName(userId);

  await createActivityLog({
    ticketId,
    userId,
    eventType: EVENT_TYPES.COMMENT_ADDED,
    description: `${actorName} added a comment to the ticket.`,
    metadata: {
      commentId: payload.commentId,
      userRole,
    },
  });

  if (userRole === USER_ROLES.ADMIN) {
    const ownerId = await resolveOwnerId({
      ticketId,
      ticket: payload.ticket,
    });

    // Prefer owner from ticket document when comment payload lacks ticket snapshot
    let recipientOwnerId = ownerId;
    if (!recipientOwnerId && ticketId) {
      const ticket = await Ticket.findById(ticketId).select('createdBy title');
      recipientOwnerId = ticket?.createdBy;
      payload.ticket = payload.ticket || ticket;
    }

    if (!recipientOwnerId) return;

    await notifyUsers({
      recipientIds: [recipientOwnerId],
      ticketId,
      message: `${actorName} commented on your ticket.`,
      type: NOTIFICATION_TYPES.COMMENT_ADDED,
      excludeUserId: userId,
    });
    return;
  }

  const adminIds = await getAdminRecipientIds();
  await notifyUsers({
    recipientIds: adminIds,
    ticketId,
    message: `${actorName} added a comment on a support ticket.`,
    type: NOTIFICATION_TYPES.COMMENT_ADDED,
    excludeUserId: userId,
  });
};

export const handleTicketDeleted = async (payload) => {
  const ticketId = resolveTicketId(payload);
  const userId = payload.userId;
  const actorName = await getActorName(userId);
  const snapshot =
    payload.ticketSnapshot || buildTicketSnapshot(payload.ticket);

  await createActivityLog({
    ticketId,
    userId,
    eventType: EVENT_TYPES.TICKET_DELETED,
    description: `${actorName} deleted the ticket.`,
    metadata: {
      ticketSnapshot: snapshot,
      retainedAfterDeletion: true,
    },
  });

  // No in-app notification for deletions by design.
};
