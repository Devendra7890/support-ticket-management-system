const TextField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  required = false,
}) => {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--stm-ink)]">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-[var(--stm-ink)] outline-none transition placeholder:text-slate-400 focus:border-[var(--stm-accent)] focus:ring-2 focus:ring-[var(--stm-accent)]/20 ${
          error ? 'border-rose-400' : 'border-[var(--stm-border)]'
        }`}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default TextField;
