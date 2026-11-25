import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  Pencil,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as ticketService from '../../services/ticketService';
import * as commentService from '../../services/commentService';
import * as activityService from '../../services/activityService';
import { getErrorMessage } from '../../utils/errorMessage';
import { formatDate } from '../../utils/formatDate';
import { isTicketEditable } from '../../utils/ticketConstants';
import {
  validateCommentForm,
  validateTicketForm,
} from '../../utils/ticketValidation';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PriorityBadge from '../../components/common/PriorityBadge';
import StatusBadge from '../../components/common/StatusBadge';
import TextAreaField from '../../components/forms/TextAreaField';
import TicketForm from '../../components/tickets/TicketForm';

const TicketDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    title: '',
    description: '',
    category: 'Technical',
    priority: 'MEDIUM',
  });
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [commentMessage, setCommentMessage] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const loadTicketData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ticketRes, commentsRes, activityRes] = await Promise.all([
        ticketService.getTicketById(id),
        commentService.getComments(id, { page: 1, limit: 100 }),
        activityService.getTicketActivity(id, { page: 1, limit: 100 }),
      ]);

      const nextTicket = ticketRes.data.ticket;
      setTicket(nextTicket);
      setEditValues({
        title: nextTicket.title,
        description: nextTicket.description,
        category: nextTicket.category,
        priority: nextTicket.priority,
      });
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

  const canEdit = ticket ? isTicketEditable(ticket.status) : false;

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
    setEditErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const nextErrors = validateTicketForm(editValues);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const response = await ticketService.updateTicket(id, {
        title: editValues.title.trim(),
        description: editValues.description.trim(),
        category: editValues.category,
        priority: editValues.priority,
      });
      setTicket(response.data.ticket);
      setEditing(false);
      toast.success('Ticket updated successfully');
      const activityRes = await activityService.getTicketActivity(id, {
        page: 1,
        limit: 100,
      });
      setActivities(activityRes.data.activities || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to update ticket.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ticketService.deleteTicket(id);
      toast.success('Ticket deleted successfully');
      navigate('/app/tickets');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to delete ticket.'));
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
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
      toast.success('Comment added');
      const activityRes = await activityService.getTicketActivity(id, {
        page: 1,
        limit: 100,
      });
      setActivities(activityRes.data.activities || []);
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
          to="/app/tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--stm-accent)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </Link>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error?.toLowerCase?.().includes('not found')
            ? 'This ticket is no longer available.'
            : error || 'This ticket is no longer available.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/app/tickets"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--stm-accent)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tickets
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

        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button
              variant="secondary"
              className="sm:w-auto"
              onClick={() => setEditing((prev) => !prev)}
            >
              {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {editing ? 'Cancel edit' : 'Edit ticket'}
            </Button>
          ) : null}
          {canEdit ? (
            <Button
              className="bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500 sm:w-auto"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      {!canEdit ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This ticket is {ticket.status.toLowerCase().replace('_', ' ')}. Editing,
          deletion, and new comments are disabled for users.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-5 sm:p-6">
            {editing ? (
              <TicketForm
                values={editValues}
                errors={editErrors}
                submitting={saving}
                submitLabel={saving ? 'Saving...' : 'Save changes'}
                onChange={handleEditChange}
                onSubmit={handleSave}
                onCancel={() => {
                  setEditing(false);
                  setEditValues({
                    title: ticket.title,
                    description: ticket.description,
                    category: ticket.category,
                    priority: ticket.priority,
                  });
                }}
              />
            ) : (
              <>
                <h2 className="text-lg font-semibold text-[var(--stm-ink)]">Description</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--stm-muted)]">
                  {ticket.description}
                </p>
                <div className="mt-6 grid gap-3 text-sm text-[var(--stm-muted)] sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-[var(--stm-ink)]">Created:</span>{' '}
                    {formatDate(ticket.createdAt)}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--stm-ink)]">Updated:</span>{' '}
                    {formatDate(ticket.updatedAt)}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[var(--stm-accent)]" />
              <h2 className="text-lg font-semibold text-[var(--stm-ink)]">Comments</h2>
            </div>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-[var(--stm-muted)]">
                  No comments yet. Start the conversation below.
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

            {canEdit ? (
              <form className="mt-5 space-y-3" onSubmit={handleAddComment}>
                <TextAreaField
                  id="commentMessage"
                  label="Add a comment"
                  value={commentMessage}
                  onChange={(event) => {
                    setCommentMessage(event.target.value);
                    setCommentError('');
                  }}
                  error={commentError}
                  placeholder="Share an update or ask a follow-up question"
                  rows={4}
                  maxLength={2000}
                />
                <Button type="submit" className="sm:w-auto" loading={commentSubmitting}>
                  <Save className="h-4 w-4" />
                  Post comment
                </Button>
              </form>
            ) : null}
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
                  className="relative border-l-2 border-cyan-100 pl-4"
                >
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--stm-accent)]" />
                  <p className="text-sm text-[var(--stm-ink)]">{activity.description}</p>
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
        open={confirmOpen}
        title="Delete this ticket?"
        description="This permanently deletes the ticket and its comments. Activity history is retained for audit purposes. This action cannot be undone."
        confirmLabel="Delete ticket"
        loading={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TicketDetailsPage;
