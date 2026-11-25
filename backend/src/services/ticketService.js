import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import { TICKET_STATUSES } from '../constants/ticket.js';
import AppError from '../utils/AppError.js';
import { buildTicketSnapshot } from '../utils/ticketSnapshot.js';
import {
  buildPaginationMeta,
  buildStableSort,
} from '../utils/pagination.js';
import {
  emitTicketCreated,
  emitTicketUpdated,
  emitTicketDeleted,
} from '../events/ticketEmitter.js';

const IMMUTABLE_STATUSES = new Set([
  TICKET_STATUSES.RESOLVED,
  TICKET_STATUSES.CLOSED,
]);

const NOT_FOUND_MESSAGE = 'Ticket not found.';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findOwnedTicketOrFail = async (ticketId, userId) => {
  const ticket = await Ticket.findOne({
    _id: ticketId,
    createdBy: userId,
  });

  if (!ticket) {
    throw new AppError(NOT_FOUND_MESSAGE, 404);
  }

  return ticket;
};

const assertTicketMutable = (ticket) => {
  if (IMMUTABLE_STATUSES.has(ticket.status)) {
    throw new AppError(
      `Tickets with status ${ticket.status} cannot be modified or deleted.`,
      400
    );
  }
};

export const createTicket = async (userId, ticketData) => {
  const ticket = await Ticket.create({
    title: ticketData.title,
    description: ticketData.description,
    category: ticketData.category,
    priority: ticketData.priority,
    createdBy: userId,
  });

  await emitTicketCreated({
    ticketId: ticket._id,
    userId,
    ticket,
  });

  return ticket;
};

export const listUserTickets = async (userId, query) => {
  const {
    status,
    priority,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
  } = query;

  const filter = { createdBy: userId };

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  const sort = buildStableSort(sortBy, sortOrder);
  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter).sort(sort).skip(skip).limit(limit),
    Ticket.countDocuments(filter),
  ]);

  return {
    tickets,
    pagination: buildPaginationMeta({ total, page, limit }),
  };
};

/**
 * Single aggregation for user dashboard counts (avoids N list queries).
 */
export const getUserTicketStats = async (userId) => {
  const match = {
    createdBy: new mongoose.Types.ObjectId(String(userId)),
  };

  const [stats] = await Ticket.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: {
          $sum: { $cond: [{ $eq: ['$status', TICKET_STATUSES.OPEN] }, 1, 0] },
        },
        inProgress: {
          $sum: {
            $cond: [{ $eq: ['$status', TICKET_STATUSES.IN_PROGRESS] }, 1, 0],
          },
        },
        resolved: {
          $sum: {
            $cond: [{ $eq: ['$status', TICKET_STATUSES.RESOLVED] }, 1, 0],
          },
        },
        closed: {
          $sum: {
            $cond: [{ $eq: ['$status', TICKET_STATUSES.CLOSED] }, 1, 0],
          },
        },
      },
    },
  ]);

  return {
    total: stats?.total || 0,
    open: stats?.open || 0,
    inProgress: stats?.inProgress || 0,
    resolved: stats?.resolved || 0,
    closed: stats?.closed || 0,
  };
};

export const getUserTicketById = async (ticketId, userId) => {
  return findOwnedTicketOrFail(ticketId, userId);
};

export const updateUserTicket = async (ticketId, userId, updates) => {
  const ticket = await findOwnedTicketOrFail(ticketId, userId);
  assertTicketMutable(ticket);

  const previous = {
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
  };

  if (updates.title !== undefined) ticket.title = updates.title;
  if (updates.description !== undefined) ticket.description = updates.description;
  if (updates.category !== undefined) ticket.category = updates.category;
  if (updates.priority !== undefined) ticket.priority = updates.priority;

  await ticket.save();

  await emitTicketUpdated({
    ticketId: ticket._id,
    userId,
    ticket,
    previous,
    changes: updates,
    previousPriority: previous.priority,
    newPriority: ticket.priority,
  });

  return ticket;
};

export const deleteUserTicket = async (ticketId, userId) => {
  const ticket = await findOwnedTicketOrFail(ticketId, userId);
  assertTicketMutable(ticket);

  const ticketSnapshot = buildTicketSnapshot(ticket);

  // Emit first and await listeners so ActivityLog is written while ticket still exists.
  // Activity logs are retained after deletion (audit trail); comments/notifications are removed.
  await emitTicketDeleted({
    ticketId: ticket._id,
    userId,
    ticket,
    ticketSnapshot,
  });

  await Promise.all([
    Comment.deleteMany({ ticket: ticket._id }),
    Notification.deleteMany({ ticket: ticket._id }),
    Ticket.deleteOne({ _id: ticket._id, createdBy: userId }),
  ]);

  return ticket;
};
