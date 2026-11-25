import { TICKET_STATUSES } from './ticket.js';

/**
 * Allowed admin status transitions.
 * CLOSED is terminal and cannot be changed.
 */
export const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  [TICKET_STATUSES.OPEN]: Object.freeze([
    TICKET_STATUSES.IN_PROGRESS,
    TICKET_STATUSES.RESOLVED,
    TICKET_STATUSES.CLOSED,
  ]),
  [TICKET_STATUSES.IN_PROGRESS]: Object.freeze([
    TICKET_STATUSES.OPEN,
    TICKET_STATUSES.RESOLVED,
    TICKET_STATUSES.CLOSED,
  ]),
  [TICKET_STATUSES.RESOLVED]: Object.freeze([
    TICKET_STATUSES.OPEN,
    TICKET_STATUSES.IN_PROGRESS,
    TICKET_STATUSES.CLOSED,
  ]),
  [TICKET_STATUSES.CLOSED]: Object.freeze([]),
});

export const canTransitionStatus = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) {
    return false;
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
};
