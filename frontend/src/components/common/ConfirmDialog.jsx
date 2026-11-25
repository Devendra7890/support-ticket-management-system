import { AlertTriangle } from 'lucide-react';
import Button from './Button';

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-3xl border border-[var(--stm-border)] bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-rose-50 p-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-[var(--stm-ink)]">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--stm-muted)]">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="sm:w-auto" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            className="bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500 sm:w-auto"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
