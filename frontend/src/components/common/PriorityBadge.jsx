const styles = {
  LOW: 'bg-slate-50 text-slate-600 ring-slate-200',
  MEDIUM: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  HIGH: 'bg-orange-50 text-orange-700 ring-orange-200',
  URGENT: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const PriorityBadge = ({ priority }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
      styles[priority] || styles.MEDIUM
    }`}
  >
    {priority}
  </span>
);

export default PriorityBadge;
