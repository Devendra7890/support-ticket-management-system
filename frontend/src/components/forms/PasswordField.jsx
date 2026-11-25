import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = 'Enter your password',
  autoComplete = 'current-password',
  required = false,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--stm-ink)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-white px-3.5 py-3 pr-12 text-sm text-[var(--stm-ink)] outline-none transition placeholder:text-slate-400 focus:border-[var(--stm-accent)] focus:ring-2 focus:ring-[var(--stm-accent)]/20 ${
            error ? 'border-rose-400' : 'border-[var(--stm-border)]'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-[var(--stm-ink)]"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default PasswordField;
