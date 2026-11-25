import { ticketEmitter, EVENT_TYPES } from './ticketEmitter.js';
import {
  handleTicketCreated,
  handleTicketUpdated,
  handleTicketStatusChanged,
  handleTicketResolved,
  handleCommentAdded,
  handleTicketDeleted,
} from './ticketListeners.js';

let listenersRegistered = false;

/**
 * Registers ticket domain listeners exactly once per process.
 * Safe for nodemon reloads (new process) and repeated import in tests.
 *
 * NOTE: This EventEmitter bus is in-process only — it is not a durable
 * message queue (no Kafka/RabbitMQ/Redis). Events are lost if the process dies
 * before listeners finish.
 */
export const registerTicketListeners = () => {
  if (listenersRegistered) {
    return false;
  }

  ticketEmitter.on(EVENT_TYPES.TICKET_CREATED, handleTicketCreated);
  ticketEmitter.on(EVENT_TYPES.TICKET_UPDATED, handleTicketUpdated);
  ticketEmitter.on(EVENT_TYPES.TICKET_STATUS_CHANGED, handleTicketStatusChanged);
  ticketEmitter.on(EVENT_TYPES.TICKET_RESOLVED, handleTicketResolved);
  ticketEmitter.on(EVENT_TYPES.COMMENT_ADDED, handleCommentAdded);
  ticketEmitter.on(EVENT_TYPES.TICKET_DELETED, handleTicketDeleted);

  listenersRegistered = true;
  console.log('Ticket event listeners registered');
  return true;
};

export const areTicketListenersRegistered = () => listenersRegistered;

/** Test-only helper to inspect registration state without re-binding. */
export const getTicketListenerCounts = () => ({
  [EVENT_TYPES.TICKET_CREATED]: ticketEmitter.listenerCount(EVENT_TYPES.TICKET_CREATED),
  [EVENT_TYPES.TICKET_UPDATED]: ticketEmitter.listenerCount(EVENT_TYPES.TICKET_UPDATED),
  [EVENT_TYPES.TICKET_STATUS_CHANGED]: ticketEmitter.listenerCount(
    EVENT_TYPES.TICKET_STATUS_CHANGED
  ),
  [EVENT_TYPES.TICKET_RESOLVED]: ticketEmitter.listenerCount(EVENT_TYPES.TICKET_RESOLVED),
  [EVENT_TYPES.COMMENT_ADDED]: ticketEmitter.listenerCount(EVENT_TYPES.COMMENT_ADDED),
  [EVENT_TYPES.TICKET_DELETED]: ticketEmitter.listenerCount(EVENT_TYPES.TICKET_DELETED),
});
