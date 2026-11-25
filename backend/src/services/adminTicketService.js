import Ticket from '../models/Ticket.js';
import AppError from '../utils/AppError.js';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '../constants/ticket.js';
import { canTransitionStatus } from '../constants/ticketTransitions.js';
import {
  buildPaginationMeta,
  buildStableSort,
} from '../utils/pagination.js';
import {
  emitTicketStatusChanged,
  emitTicketUpdated,
} from '../events/ticketEmitter.js';

const NOT_FOUND_MESSAGE = 'Ticket not found.';
const SAFE_CREATOR_FIELDS = 'name email';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findTicketOrFail = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId).populate(
    'createdBy',
    SAFE_CREATOR_FIELDS
  );

  if (!ticket) {
    throw new AppError(NOT_FOUND_MESSAGE, 404);
  }

  return ticket;
};

export const listAllTickets = async (query) => {
  const {
    status,
    priority,
    category,
    createdBy,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
  } = query;

  const filter = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (createdBy) filter.createdBy = createdBy;

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  const sort = buildStableSort(sortBy, sortOrder);
  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('createdBy', SAFE_CREATOR_FIELDS)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Ticket.countDocuments(filter),
  ]);

  return {
    tickets,
    pagination: buildPaginationMeta({ total, page, limit }),
  };
};

/**
 * Single aggregation for admin dashboard counts (avoids N list queries).
 */
export const getAdminTicketStats = async () => {
  const [stats] = await Ticket.aggregate([
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
        high: {
          $sum: {
            $cond: [{ $eq: ['$priority', TICKET_PRIORITIES.HIGH] }, 1, 0],
          },
        },
        urgent: {
          $sum: {
            $cond: [{ $eq: ['$priority', TICKET_PRIORITIES.URGENT] }, 1, 0],
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
    high: stats?.high || 0,
    urgent: stats?.urgent || 0,
  };
};

export const getTicketById = async (ticketId) => {
  return findTicketOrFail(ticketId);
};

export const updateTicketStatus = async (ticketId, adminUserId, status) => {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw new AppError(NOT_FOUND_MESSAGE, 404);
  }

  const previousStatus = ticket.status;

  if (previousStatus === status) {
    throw new AppError(`Ticket is already in status ${status}.`, 400);
  }

  if (!canTransitionStatus(previousStatus, status)) {
    throw new AppError(
      `Invalid status transition from ${previousStatus} to ${status}.`,
      400
    );
  }

  ticket.status = status;
  await ticket.save();

  const populatedTicket = await Ticket.findById(ticket._id).populate(
    'createdBy',
    SAFE_CREATOR_FIELDS
  );

  const transition = {
    from: previousStatus,
    to: status,
  };

  await emitTicketStatusChanged({
    ticketId: populatedTicket._id,
    ticket: populatedTicket,
    userId: adminUserId,
    previousStatus,
    newStatus: status,
    transition,
  });

  return {
    ticket: populatedTicket,
    transition,
  };
};

export const updateTicketPriority = async (ticketId, adminUserId, priority) => {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw new AppError(NOT_FOUND_MESSAGE, 404);
  }

  const previousPriority = ticket.priority;

  if (previousPriority === priority) {
    throw new AppError(`Ticket already has priority ${priority}.`, 400);
  }

  ticket.priority = priority;
  await ticket.save();

  const populatedTicket = await Ticket.findById(ticket._id).populate(
    'createdBy',
    SAFE_CREATOR_FIELDS
  );

  await emitTicketUpdated({
    ticketId: populatedTicket._id,
    ticket: populatedTicket,
    userId: adminUserId,
    previous: { priority: previousPriority },
    changes: { priority },
    previousPriority,
    newPriority: priority,
  });

  return {
    ticket: populatedTicket,
    transition: {
      from: previousPriority,
      to: priority,
    },
  };
};
