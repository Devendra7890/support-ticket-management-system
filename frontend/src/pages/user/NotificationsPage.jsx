import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import * as notificationService from '../../services/notificationService';
import { getErrorMessage } from '../../utils/errorMessage';
import { formatDate } from '../../utils/formatDate';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import NotificationTicketStatus from '../../components/notifications/NotificationTicketStatus';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await notificationService.getNotifications({
        page: 1,
        limit: 50,
      });
      setNotifications(response.data.notifications || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load notifications.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((note) => (note._id === id ? { ...note, isRead: true } : note))
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to mark notification as read.'));
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((note) => ({ ...note, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to update notifications.'));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--stm-accent)]">
            Inbox
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--stm-ink)]">
            Notifications
          </h1>
          <p className="mt-2 text-[var(--stm-muted)]">
            Updates related to your tickets and support conversations.
          </p>
        </div>
        <Button
          variant="secondary"
          className="sm:w-auto"
          loading={markingAll}
          onClick={handleMarkAll}
          disabled={notifications.every((note) => note.isRead)}
        >
          Mark all read
        </Button>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-8 text-sm text-[var(--stm-muted)]">
          Loading notifications...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You are all caught up. Ticket updates will appear here."
        />
      ) : null}

      {!loading && !error && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((note) => (
            <article
              key={note._id}
              className={`rounded-3xl border p-4 sm:p-5 ${
                note.isRead
                  ? 'border-[var(--stm-border)] bg-white'
                  : 'border-cyan-200 bg-cyan-50/40'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--stm-ink)]">{note.message}</p>
                  <p className="mt-2 text-xs text-[var(--stm-muted)]">
                    {note.type} · {formatDate(note.createdAt)}
                    {note.ticket?.available && note.ticket?.title
                      ? ` · ${note.ticket.title}`
                      : ''}
                  </p>
                  <NotificationTicketStatus
                    ticket={note.ticket}
                    ticketPathPrefix="/app/tickets"
                  />
                </div>
                {!note.isRead ? (
                  <Button
                    variant="secondary"
                    className="sm:w-auto"
                    onClick={() => handleMarkRead(note._id)}
                  >
                    Mark read
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default NotificationsPage;
