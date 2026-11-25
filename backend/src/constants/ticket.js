export const TICKET_PRIORITIES = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
});

export const TICKET_PRIORITY_VALUES = Object.freeze(Object.values(TICKET_PRIORITIES));

export const TICKET_STATUSES = Object.freeze({
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
});

export const TICKET_STATUS_VALUES = Object.freeze(Object.values(TICKET_STATUSES));
