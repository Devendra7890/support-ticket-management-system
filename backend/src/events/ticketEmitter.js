import { EventEmitter } from 'events';
import { EVENT_TYPES } from '../constants/events.js';
import { TICKET_STATUSES } from '../constants/ticket.js';

/**
 * In-process EventEmitter bus (not a durable message queue).
 * Events are handled only within the current Node.js process.
 * Listeners are registered once via registerTicketListeners().
 */
const ticketEmitter = new EventEmitter();
ticketEmitter.setMaxListeners(20);

/**
 * Emit an event and safely settle all listeners (including async ones).
 * Failures are logged and do not reject the emitter call.
 */
export const emitWithHandlers = async (eventName, payload) => {
  const listeners = ticketEmitter.listeners(eventName);

  if (listeners.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    listeners.map((listener) => Promise.resolve().then(() => listener(payload)))
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(
        `[events:${eventName}] listener failed:`,
        result.reason?.message || result.reason
      );
    }
  }
};

export const emitTicketCreated = async (payload) => {
  await emitWithHandlers(EVENT_TYPES.TICKET_CREATED, payload);
};

export const emitTicketUpdated = async (payload) => {
  await emitWithHandlers(EVENT_TYPES.TICKET_UPDATED, payload);
};

export const emitTicketStatusChanged = async (payload) => {
  await emitWithHandlers(EVENT_TYPES.TICKET_STATUS_CHANGED, payload);

  if (
    payload?.newStatus === TICKET_STATUSES.RESOLVED ||
    payload?.ticket?.status === TICKET_STATUSES.RESOLVED
  ) {
    await emitWithHandlers(EVENT_TYPES.TICKET_RESOLVED, payload);
  }
};

export const emitTicketDeleted = async (payload) => {
  await emitWithHandlers(EVENT_TYPES.TICKET_DELETED, payload);
};

export const emitCommentAdded = async (payload) => {
  await emitWithHandlers(EVENT_TYPES.COMMENT_ADDED, payload);
};

export { ticketEmitter, EVENT_TYPES };
