import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CircleCheckBig,
  Clock3,
  FolderOpen,
  Ticket,
  XCircle,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import * as adminTicketService from '../../services/adminTicketService';
import { getErrorMessage } from '../../utils/errorMessage';
import { formatDate } from '../../utils/formatDate';
import AdminStatsCard from '../../components/admin/AdminStatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    high: 0,
    urgent: 0,
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [latestUpdates, setLatestUpdates] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, recentRes, updatedRes] = await Promise.all([
          adminTicketService.getAdminTicketStats(),
          adminTicketService.getAdminTickets({
            page: 1,
            limit: 5,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          }),
          adminTicketService.getAdminTickets({
            page: 1,
            limit: 5,
            sortBy: 'updatedAt',
            sortOrder: 'desc',
          }),
        ]);

        const nextStats = statsRes.data.stats || {};
        setStats({
          total: nextStats.total || 0,
          open: nextStats.open || 0,
          inProgress: nextStats.inProgress || 0,
          resolved: nextStats.resolved || 0,
          closed: nextStats.closed || 0,
          high: nextStats.high || 0,
          urgent: nextStats.urgent || 0,
        });
        setRecentTickets(recentRes.data.tickets || []);
        setLatestUpdates(updatedRes.data.tickets || []);
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load admin dashboard.'));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
            Admin Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--stm-ink)]">
            Welcome, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="mt-2 text-[var(--stm-muted)]">
            Monitor all support tickets and prioritize urgent work.
          </p>
        </div>
        <Link to="/admin/tickets">
          <Button className="bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-700 sm:w-auto">
            <Ticket className="h-4 w-4" />
            Manage tickets
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-8 text-sm text-[var(--stm-muted)]">
          Loading dashboard statistics...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatsCard label="Total tickets" value={stats.total} icon={Ticket} />
            <AdminStatsCard
              label="Open"
              value={stats.open}
              icon={FolderOpen}
              tone="bg-sky-50 text-sky-700"
            />
            <AdminStatsCard
              label="In progress"
              value={stats.inProgress}
              icon={Clock3}
              tone="bg-amber-50 text-amber-700"
            />
            <AdminStatsCard
              label="Resolved"
              value={stats.resolved}
              icon={CircleCheckBig}
              tone="bg-emerald-50 text-emerald-700"
            />
            <AdminStatsCard
              label="Closed"
              value={stats.closed}
              icon={XCircle}
              tone="bg-slate-100 text-slate-600"
            />
            <AdminStatsCard
              label="High priority"
              value={stats.high}
              icon={AlertTriangle}
              tone="bg-orange-50 text-orange-700"
            />
            <AdminStatsCard
              label="Urgent"
              value={stats.urgent}
              icon={Flame}
              tone="bg-rose-50 text-rose-700"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl border border-[var(--stm-border)] bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--stm-ink)]">
                  Recently submitted
                </h2>
                <Link
                  to="/admin/tickets"
                  className="text-sm font-semibold text-slate-800 hover:underline"
                >
                  View all
                </Link>
              </div>
              {recentTickets.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="No tickets yet"
                  description="New user tickets will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {recentTickets.map((ticket) => (
                    <Link
                      key={ticket._id}
                      to={`/admin/tickets/${ticket._id}`}
                      className="block rounded-2xl border border-[var(--stm-border)] p-4 hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--stm-ink)]">
                            {ticket.title}
                          </p>
                          <p className="mt-1 text-xs text-[var(--stm-muted)]">
                            {ticket.createdBy?.name || 'Unknown'} ·{' '}
                            {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={ticket.status} />
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-[var(--stm-border)] bg-white p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-[var(--stm-ink)]">
                Latest updates
              </h2>
              {latestUpdates.length === 0 ? (
                <p className="text-sm text-[var(--stm-muted)]">No recent updates.</p>
              ) : (
                <div className="space-y-3">
                  {latestUpdates.map((ticket) => (
                    <Link
                      key={`updated-${ticket._id}`}
                      to={`/admin/tickets/${ticket._id}`}
                      className="block rounded-2xl border border-[var(--stm-border)] p-4 hover:bg-slate-50"
                    >
                      <p className="font-semibold text-[var(--stm-ink)]">{ticket.title}</p>
                      <p className="mt-1 text-xs text-[var(--stm-muted)]">
                        Updated {formatDate(ticket.updatedAt)} · {ticket.status}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;
