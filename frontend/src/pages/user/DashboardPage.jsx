import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CircleCheckBig,
  Clock3,
  FolderOpen,
  PlusCircle,
  Ticket,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import * as ticketService from '../../services/ticketService';
import * as notificationService from '../../services/notificationService';
import { getErrorMessage } from '../../utils/errorMessage';
import { formatDate, formatRelativeDate } from '../../utils/formatDate';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const StatCard = ({ label, value, icon: Icon, tone }) => (
  <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-[var(--stm-muted)]">{label}</p>
        <p className="mt-2 text-3xl font-bold text-[var(--stm-ink)]">{value}</p>
      </div>
      <span className={`rounded-2xl p-3 ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, recentRes, notesRes] = await Promise.all([
          ticketService.getTicketStats(),
          ticketService.getTickets({
            page: 1,
            limit: 5,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          }),
          notificationService.getNotifications({ page: 1, limit: 5 }),
        ]);

        const nextStats = statsRes.data.stats || {};
        setStats({
          total: nextStats.total || 0,
          open: nextStats.open || 0,
          inProgress: nextStats.inProgress || 0,
          resolved: nextStats.resolved || 0,
        });
        setRecentTickets(recentRes.data.tickets || []);
        setRecentNotifications(notesRes.data.notifications || []);
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load dashboard data.'));
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
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--stm-accent)]">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--stm-ink)]">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-2 text-[var(--stm-muted)]">
            Track your support tickets and recent workspace activity.
          </p>
        </div>
        <Link to="/app/tickets/create" className="sm:w-auto">
          <Button className="sm:w-auto">
            <PlusCircle className="h-4 w-4" />
            Create ticket
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-8 text-sm text-[var(--stm-muted)]">
          Loading dashboard...
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
            <StatCard
              label="Total tickets"
              value={stats.total}
              icon={Ticket}
              tone="bg-slate-100 text-slate-700"
            />
            <StatCard
              label="Open"
              value={stats.open}
              icon={FolderOpen}
              tone="bg-sky-50 text-sky-700"
            />
            <StatCard
              label="In progress"
              value={stats.inProgress}
              icon={Clock3}
              tone="bg-amber-50 text-amber-700"
            />
            <StatCard
              label="Resolved"
              value={stats.resolved}
              icon={CircleCheckBig}
              tone="bg-emerald-50 text-emerald-700"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className="rounded-3xl border border-[var(--stm-border)] bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[var(--stm-ink)]">
                  Recently created tickets
                </h2>
                <Link
                  to="/app/tickets"
                  className="text-sm font-semibold text-[var(--stm-accent)] hover:underline"
                >
                  View all
                </Link>
              </div>

              {recentTickets.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="No tickets yet"
                  description="Create your first support ticket to get help from the team."
                  action={
                    <Link to="/app/tickets/create">
                      <Button className="sm:w-auto">Create ticket</Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {recentTickets.map((ticket) => (
                    <Link
                      key={ticket._id}
                      to={`/app/tickets/${ticket._id}`}
                      className="block rounded-2xl border border-[var(--stm-border)] p-4 transition hover:border-[var(--stm-accent)]/40 hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--stm-ink)]">
                            {ticket.title}
                          </p>
                          <p className="mt-1 text-xs text-[var(--stm-muted)]">
                            {ticket.category} · {formatDate(ticket.createdAt)}
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
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[var(--stm-ink)]">
                  Recent activity
                </h2>
                <Link
                  to="/app/notifications"
                  className="text-sm font-semibold text-[var(--stm-accent)] hover:underline"
                >
                  Notifications
                </Link>
              </div>

              {recentNotifications.length === 0 ? (
                <p className="text-sm text-[var(--stm-muted)]">
                  No recent notifications yet. Updates about your tickets will appear here.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentNotifications.map((note) => (
                    <div
                      key={note._id}
                      className="rounded-2xl border border-[var(--stm-border)] p-4"
                    >
                      <p className="text-sm text-[var(--stm-ink)]">{note.message}</p>
                      <p className="mt-2 text-xs text-[var(--stm-muted)]">
                        {formatRelativeDate(note.createdAt)}
                        {!note.isRead ? ' · Unread' : ''}
                      </p>
                    </div>
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

export default DashboardPage;
