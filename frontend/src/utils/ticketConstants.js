export const TICKET_STATUSES = Object.freeze({
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
});

export const TICKET_STATUS_OPTIONS = Object.freeze([
  { value: '', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
]);

export const TICKET_PRIORITIES = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
});

export const TICKET_PRIORITY_OPTIONS = Object.freeze([
  { value: '', label: 'All priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]);

export const TICKET_PRIORITY_FORM_OPTIONS = Object.freeze([
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]);

export const TICKET_CATEGORY_OPTIONS = Object.freeze([
  { value: 'Technical', label: 'Technical' },
  { value: 'Billing', label: 'Billing' },
  { value: 'Account', label: 'Account' },
  { value: 'General', label: 'General' },
  { value: 'Other', label: 'Other' },
]);

export const isTicketEditable = (status) =>
  status !== TICKET_STATUSES.RESOLVED && status !== TICKET_STATUSES.CLOSED;

/** Mirrors backend ALLOWED_STATUS_TRANSITIONS (backend remains authoritative). */
export const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  OPEN: Object.freeze(['IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  IN_PROGRESS: Object.freeze(['OPEN', 'RESOLVED', 'CLOSED']),
  RESOLVED: Object.freeze(['OPEN', 'IN_PROGRESS', 'CLOSED']),
  CLOSED: Object.freeze([]),
});

export const getAllowedStatusTransitions = (currentStatus) =>
  ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

export const STATUS_LABELS = Object.freeze({
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
});

export const ADMIN_CATEGORY_FILTER_OPTIONS = Object.freeze([
  { value: '', label: 'All categories' },
  ...TICKET_CATEGORY_OPTIONS,
]);

