import Ticket from '../models/Ticket.js';
import { USER_ROLES } from '../constants/roles.js';
import AppError from '../utils/AppError.js';

const NOT_FOUND_MESSAGE = 'Ticket not found.';

/**
 * Returns a ticket the current user is allowed to access.
 * - ADMIN: any existing ticket
 * - USER: only tickets they own (DB-level ownership filter)
 */
export const getAccessibleTicketOrFail = async (ticketId, user) => {
  const filter =
    user.role === USER_ROLES.ADMIN
      ? { _id: ticketId }
      : { _id: ticketId, createdBy: user.id };

  const ticket = await Ticket.findOne(filter);

  if (!ticket) {
    throw new AppError(NOT_FOUND_MESSAGE, 404);
  }

  return ticket;
};
