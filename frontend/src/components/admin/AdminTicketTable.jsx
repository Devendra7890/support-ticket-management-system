import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import { formatDate } from '../../utils/formatDate';

const shortId = (id = '') => String(id).slice(-8).toUpperCase();

const AdminTicketTable = ({ tickets }) => (
  <>
    <div className="space-y-3 lg:hidden">
      {tickets.map((ticket) => (
        <Link
          key={ticket._id}
          to={`/admin/tickets/${ticket._id}`}
          className="block rounded-3xl border border-[var(--stm-border)] bg-white p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--stm-muted)]">
            #{shortId(ticket._id)}
          </p>
          <p className="mt-1 font-semibold text-[var(--stm-ink)]">{ticket.title}</p>
          <p className="mt-1 text-xs text-[var(--stm-muted)]">
            {ticket.createdBy?.name || 'Unknown'} · {ticket.createdBy?.email || '—'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </Link>
      ))}
    </div>

    <div className="hidden overflow-hidden rounded-3xl border border-[var(--stm-border)] bg-white lg:block">
      <table className="min-w-full divide-y divide-[var(--stm-border)] text-left text-sm">
        <thead className="bg-slate-50 text-[var(--stm-muted)]">
          <tr>
            <th className="px-4 py-3 font-medium">Ticket ID</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--stm-border)]">
          {tickets.map((ticket) => (
            <tr key={ticket._id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3 font-mono text-xs text-[var(--stm-muted)]">
                #{shortId(ticket._id)}
              </td>
              <td className="max-w-[220px] truncate px-4 py-3 font-medium text-[var(--stm-ink)]">
                {ticket.title}
              </td>
              <td className="px-4 py-3 text-[var(--stm-muted)]">
                {ticket.createdBy?.name || 'Unknown'}
              </td>
              <td className="max-w-[180px] truncate px-4 py-3 text-[var(--stm-muted)]">
                {ticket.createdBy?.email || '—'}
              </td>
              <td className="px-4 py-3 text-[var(--stm-muted)]">{ticket.category}</td>
              <td className="px-4 py-3">
                <PriorityBadge priority={ticket.priority} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="px-4 py-3 text-[var(--stm-muted)]">
                {formatDate(ticket.createdAt)}
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/admin/tickets/${ticket._id}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-800 hover:underline"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

export default AdminTicketTable;
