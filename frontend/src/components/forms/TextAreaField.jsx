const TextAreaField = ({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  rows = 5,
  required = false,
  maxLength,
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-[var(--stm-ink)]">
      {label}
    </label>
    <textarea
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      maxLength={maxLength}
      aria-invalid={Boolean(error)}
      className={`w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm text-[var(--stm-ink)] outline-none transition placeholder:text-slate-400 focus:border-[var(--stm-accent)] focus:ring-2 focus:ring-[var(--stm-accent)]/20 ${
        error ? 'border-rose-400' : 'border-[var(--stm-border)]'
      }`}
    />
    {error ? <p className="text-sm text-rose-600">{error}</p> : null}
  </div>
);

export default TextAreaField;
