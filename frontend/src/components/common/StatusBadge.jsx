const styles = {
  OPEN: 'bg-sky-50 text-sky-700 ring-sky-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const labels = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
      styles[status] || styles.CLOSED
    }`}
  >
    {labels[status] || status}
  </span>
);

export default StatusBadge;
