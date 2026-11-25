import Comment from '../models/Comment.js';
import { USER_ROLES } from '../constants/roles.js';
import { TICKET_STATUSES } from '../constants/ticket.js';
import AppError from '../utils/AppError.js';
import {
  buildPaginationMeta,
  buildStableSort,
} from '../utils/pagination.js';
import { getAccessibleTicketOrFail } from './ticketAccessService.js';
import { emitCommentAdded } from '../events/ticketEmitter.js';

const SAFE_AUTHOR_FIELDS = 'name role';
const USER_LOCKED_STATUSES = new Set([
  TICKET_STATUSES.RESOLVED,
  TICKET_STATUSES.CLOSED,
]);

const populateAuthor = (query) => query.populate('user', SAFE_AUTHOR_FIELDS);

export const addComment = async (ticketId, user, message) => {
  const ticket = await getAccessibleTicketOrFail(ticketId, user);

  if (
    user.role !== USER_ROLES.ADMIN &&
    USER_LOCKED_STATUSES.has(ticket.status)
  ) {
    throw new AppError(
      `Comments cannot be added to tickets with status ${ticket.status}.`,
      400
    );
  }

  const comment = await Comment.create({
    ticket: ticket._id,
    user: user.id,
    message,
  });

  const populatedComment = await populateAuthor(Comment.findById(comment._id));

  await emitCommentAdded({
    ticketId: ticket._id,
    commentId: comment._id,
    userId: user.id,
    userRole: user.role,
    ticket,
    comment: populatedComment,
  });

  return populatedComment;
};

export const listComments = async (ticketId, user, query) => {
  await getAccessibleTicketOrFail(ticketId, user);

  const { page, limit } = query;
  const filter = { ticket: ticketId };
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    populateAuthor(
      Comment.find(filter)
        .sort(buildStableSort('createdAt', 'asc'))
        .skip(skip)
        .limit(limit)
    ),
    Comment.countDocuments(filter),
  ]);

  return {
    comments,
    pagination: buildPaginationMeta({ total, page, limit }),
  };
};
