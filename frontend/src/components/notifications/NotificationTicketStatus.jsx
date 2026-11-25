import { Link } from 'react-router-dom';

/**
 * Renders ticket link or a graceful unavailable message for retained
 * notifications whose ticket was deleted.
 */
const NotificationTicketStatus = ({ ticket, ticketPathPrefix }) => {
  if (!ticket) return null;

  const ticketId = ticket._id || ticket;
  const available = ticket.available !== false && Boolean(ticketId);

  if (!available) {
    return (
      <p className="mt-2 text-xs font-medium text-amber-700">
        This ticket is no longer available.
      </p>
    );
  }

  if (!ticketPathPrefix) return null;

  return (
    <Link
      to={`${ticketPathPrefix}/${ticketId}`}
      className="mt-2 inline-block text-xs font-semibold text-slate-800 hover:underline"
    >
      Open ticket
      {ticket.title ? `: ${ticket.title}` : ''}
    </Link>
  );
};

export default NotificationTicketStatus;
