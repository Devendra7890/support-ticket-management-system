import ActivityLog from '../models/ActivityLog.js';
import AppError from '../utils/AppError.js';
import { getAccessibleTicketOrFail } from './ticketAccessService.js';
import { USER_ROLES } from '../constants/roles.js';
import Ticket from '../models/Ticket.js';
import {
  buildPaginationMeta,
  buildStableSort,
} from '../utils/pagination.js';

const SAFE_USER_FIELDS = 'name role';

export const createActivityLog = async ({
  ticketId,
  userId,
  eventType,
  description,
  metadata = {},
}) => {
  if (!userId || !eventType || !description) {
    throw new Error('Activity log requires userId, eventType, and description');
  }

  return ActivityLog.create({
    ticket: ticketId || undefined,
    user: userId,
    eventType,
    description,
    metadata,
  });
};

export const listTicketActivity = async (ticketId, user, query) => {
  const { page, limit } = query;

  const ticket = await Ticket.findById(ticketId);

  if (ticket) {
    await getAccessibleTicketOrFail(ticketId, user);
  } else if (user.role !== USER_ROLES.ADMIN) {
    // Deleted ticket: only admins may inspect retained audit history
    throw new AppError('Ticket not found.', 404);
  }

  const filter = { ticket: ticketId };
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('user', SAFE_USER_FIELDS)
      .sort(buildStableSort('createdAt', 'asc'))
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  return {
    activities,
    pagination: buildPaginationMeta({ total, page, limit }),
    ticketExists: Boolean(ticket),
  };
};
