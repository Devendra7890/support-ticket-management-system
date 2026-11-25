const AdminStatsCard = ({ label, value, icon: Icon, tone = 'bg-slate-100 text-slate-700' }) => (
  <div className="rounded-3xl border border-[var(--stm-border)] bg-white p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-[var(--stm-muted)]">{label}</p>
        <p className="mt-2 text-3xl font-bold text-[var(--stm-ink)]">{value}</p>
      </div>
      {Icon ? (
        <span className={`rounded-2xl p-3 ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
    </div>
  </div>
);

export default AdminStatsCard;
