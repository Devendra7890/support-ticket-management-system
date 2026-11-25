import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import * as adminTicketService from '../../services/adminTicketService';
import * as commentService from '../../services/commentService';
import * as activityService from '../../services/activityService';
import { getErrorMessage } from '../../utils/errorMessage';
import { formatDate } from '../../utils/formatDate';
import {
  getAllowedStatusTransitions,
  STATUS_LABELS,
  TICKET_PRIORITY_FORM_OPTIONS,
  TICKET_STATUSES,
} from '../../utils/ticketConstants';
import { validateCommentForm } from '../../utils/ticketValidation';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PriorityBadge from '../../components/common/PriorityBadge';
import StatusBadge from '../../components/common/StatusBadge';
import SelectField from '../../components/forms/SelectField';
import TextAreaField from '../../components/forms/TextAreaField';

const AdminTicketDetailsPage = () => {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null);

  const [selectedPriority, setSelectedPriority] = useState('');
  const [prioritySaving, setPrioritySaving] = useState(false);

  const [commentMessage, setCommentMessage] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const allowedTransitions = useMemo(
    () => (ticket ? getAllowedStatusTransitions(ticket.status) : []),
    [ticket]
  );

  const statusOptions = useMemo(
    () => [
      {
        value: ticket?.status || '',
        label: `${STATUS_LABELS[ticket?.status] || ticket?.status} (current)`,
      },
      ...allowedTransitions.map((status) => ({
        value: status,
        label: STATUS_LABELS[status] || status,
      })),
    ],
    [ticket, allowedTransitions]
  );

  const refreshActivity = async () => {
    try {
      const activityRes = await activityService.getTicketActivity(id, {
        page: 1,
        limit: 100,
      });
      setActivities(activityRes.data.activities || []);
    } catch {
      // Keep existing timeline if refresh fails
    }
  };

  const loadTicketData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ticketRes, commentsRes, activityRes] = await Promise.all([
        adminTicketService.getAdminTicketById(id),
        commentService.getComments(id, { page: 1, limit: 100 }),
        activityService.getTicketActivity(id, { page: 1, limit: 100 }),
      ]);

      const nextTicket = ticketRes.data.ticket;
      setTicket(nextTicket);
      setSelectedStatus(nextTicket.status);
      setSelectedPriority(nextTicket.priority);
      setComments(commentsRes.data.comments || []);
      setActivities(activityRes.data.activities || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load ticket details.'));
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [id]);

  const applyStatusUpdate = async (nextStatus) => {
    setStatusSaving(true);
    try {
      const response = await adminTicketService.updateTicketStatus(id, nextStatus);
      const updated = response.data.ticket;
      setTicket(updated);
      setSelectedStatus(updated.status);
      setConfirmStatus(null);
      toast.success(`Status updated to ${STATUS_LABELS[updated.status] || updated.status}`);
      await refreshActivity();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to update status.'));
      setSelectedStatus(ticket?.status || '');
      setConfirmStatus(null);
    } finally {
      setStatusSaving(false);
    }
  };

  const handleStatusChange = (event) => {
    const nextStatus = event.target.value;
    setSelectedStatus(nextStatus);

    if (!ticket || nextStatus === ticket.status) return;

    if (
      nextStatus === TICKET_STATUSES.RESOLVED ||
      nextStatus === TICKET_STATUSES.CLOSED
    ) {
      setConfirmStatus(nextStatus);
      return;
    }

    applyStatusUpdate(nextStatus);
  };

  const handlePriorityChange = async (event) => {
    const nextPriority = event.target.value;
    setSelectedPriority(nextPriority);

    if (!ticket || nextPriority === ticket.priority) return;

    setPrioritySaving(true);
    try {
      const response = await adminTicketService.updateTicketPriority(id, nextPriority);
      const updated = response.data.ticket;
      setTicket(updated);
      setSelectedPriority(updated.priority);
      toast.success(`Priority updated to ${updated.priority}`);
      await refreshActivity();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to update priority.'));
      setSelectedPriority(ticket.priority);
    } finally {
      setPrioritySaving(false);
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();
    const validationError = validateCommentForm(commentMessage);
    setCommentError(validationError || '');
    if (validationError) return;

    setCommentSubmitting(true);
    try {
      const response = await commentService.addComment(id, commentMessage.trim());
      setComments((prev) => [...prev, response.data.comment]);
      setCommentMessage('');
      toast.success('Reply posted');
      await refreshActivity();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to add comment.'));
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-8 text-sm text-[var(--stm-muted)]">
        Loading ticket details...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all tickets
        </Link>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error?.toLowerCase?.().includes('not found')
            ? 'This ticket is no longer available.'
            : error || 'This ticket is no longer available.'}
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === TICKET_STATUSES.CLOSED;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all tickets
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--stm-ink)]">
          {ticket.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {ticket.category}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[var(--stm-ink)]">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--stm-muted)]">
              {ticket.description}
            </p>

            <div className="mt-6 grid gap-3 text-sm text-[var(--stm-muted)] sm:grid-cols-2">
              <p>
                <span className="font-medium text-[var(--stm-ink)]">Creator:</span>{' '}
                {ticket.createdBy?.name || 'Unknown'}
              </p>
              <p>
                <span className="font-medium text-[var(--stm-ink)]">Email:</span>{' '}
                {ticket.createdBy?.email || '—'}
              </p>
              <p>
                <span className="font-medium text-[var(--stm-ink)]">Created:</span>{' '}
                {formatDate(ticket.createdAt)}
              </p>
              <p>
                <span className="font-medium text-[var(--stm-ink)]">Updated:</span>{' '}
                {formatDate(ticket.updatedAt)}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[var(--stm-ink)]">
              Status & priority
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SelectField
                id="adminStatus"
                label="Status"
                value={selectedStatus}
                onChange={handleStatusChange}
                options={statusOptions}
                required
              />
              <div className="space-y-1.5">
                <SelectField
                  id="adminPriority"
                  label="Priority"
                  value={selectedPriority}
                  onChange={handlePriorityChange}
                  options={TICKET_PRIORITY_FORM_OPTIONS}
                  required
                />
                {prioritySaving ? (
                  <p className="text-xs text-[var(--stm-muted)]">Updating priority...</p>
                ) : null}
                {statusSaving ? (
                  <p className="text-xs text-[var(--stm-muted)]">Updating status...</p>
                ) : null}
              </div>
            </div>
            {isClosed ? (
              <p className="mt-3 text-sm text-amber-800">
                Closed tickets are terminal. Status cannot be changed again.
              </p>
            ) : allowedTransitions.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--stm-muted)]">
                No status transitions are available.
              </p>
            ) : (
              <p className="mt-3 text-sm text-[var(--stm-muted)]">
                Allowed next statuses:{' '}
                {allowedTransitions.map((s) => STATUS_LABELS[s] || s).join(', ')}
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-[var(--stm-ink)]">Comments</h2>
            </div>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-[var(--stm-muted)]">
                  No comments yet. Reply to the ticket owner below.
                </p>
              ) : (
                comments.map((comment) => (
                  <article
                    key={comment._id}
                    className="rounded-2xl border border-[var(--stm-border)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--stm-ink)]">
                        {comment.user?.name || 'User'}
                        <span className="ml-2 text-xs font-medium text-[var(--stm-muted)]">
                          {comment.user?.role}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--stm-muted)]">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--stm-muted)]">
                      {comment.message}
                    </p>
                  </article>
                ))
              )}
            </div>

            <form className="mt-5 space-y-3" onSubmit={handleAddComment}>
              <TextAreaField
                id="adminCommentMessage"
                label="Admin reply"
                value={commentMessage}
                onChange={(event) => {
                  setCommentMessage(event.target.value);
                  setCommentError('');
                }}
                error={commentError}
                placeholder="Reply to the ticket owner"
                rows={4}
                maxLength={2000}
              />
              <Button type="submit" className="sm:w-auto" loading={commentSubmitting}>
                <Save className="h-4 w-4" />
                Post reply
              </Button>
            </form>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--stm-border)] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--stm-ink)]">Activity timeline</h2>
          <div className="mt-4 space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-[var(--stm-muted)]">No activity recorded yet.</p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity._id}
                  className="relative border-l-2 border-slate-200 pl-4"
                >
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-800" />
                  <p className="text-sm text-[var(--stm-ink)]">
                    {activity.description ||
                      activity.metadata?.ticketSnapshot?.title ||
                      activity.eventType}
                  </p>
                  {activity.eventType === 'TICKET_DELETED' &&
                  activity.metadata?.ticketSnapshot ? (
                    <p className="mt-1 text-xs text-amber-700">
                      Deleted ticket snapshot retained
                      {activity.metadata.ticketSnapshot.title
                        ? `: ${activity.metadata.ticketSnapshot.title}`
                        : ''}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--stm-muted)]">
                    {activity.user?.name || 'System'} · {activity.eventType} ·{' '}
                    {formatDate(activity.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(confirmStatus)}
        title={
          confirmStatus === TICKET_STATUSES.CLOSED
            ? 'Close this ticket?'
            : 'Resolve this ticket?'
        }
        description={
          confirmStatus === TICKET_STATUSES.CLOSED
            ? 'Closing a ticket is permanent. Closed tickets cannot be reopened.'
            : 'Mark this ticket as resolved? The user will be notified of the status change.'
        }
        confirmLabel={
          confirmStatus === TICKET_STATUSES.CLOSED ? 'Close ticket' : 'Resolve ticket'
        }
        loading={statusSaving}
        onCancel={() => {
          setConfirmStatus(null);
          setSelectedStatus(ticket.status);
        }}
        onConfirm={() => applyStatusUpdate(confirmStatus)}
      />
    </div>
  );
};

export default AdminTicketDetailsPage;
