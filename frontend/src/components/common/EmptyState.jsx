const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--stm-border)] bg-white px-6 py-16 text-center">
    {Icon ? (
      <span className="mb-4 rounded-2xl bg-cyan-50 p-3 text-[var(--stm-accent)]">
        <Icon className="h-6 w-6" />
      </span>
    ) : null}
    <h3 className="text-lg font-semibold text-[var(--stm-ink)]">{title}</h3>
    {description ? (
      <p className="mt-2 max-w-md text-sm text-[var(--stm-muted)]">{description}</p>
    ) : null}
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);

export default EmptyState;
