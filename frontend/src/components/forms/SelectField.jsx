const SelectField = ({
  id,
  label,
  value,
  onChange,
  options = [],
  error,
  required = false,
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-[var(--stm-ink)]">
      {label}
    </label>
    <select
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      aria-invalid={Boolean(error)}
      className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-[var(--stm-ink)] outline-none transition focus:border-[var(--stm-accent)] focus:ring-2 focus:ring-[var(--stm-accent)]/20 ${
        error ? 'border-rose-400' : 'border-[var(--stm-border)]'
      }`}
    >
      {options.map((option) => (
        <option key={`${id}-${option.value}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error ? <p className="text-sm text-rose-600">{error}</p> : null}
  </div>
);

export default SelectField;
