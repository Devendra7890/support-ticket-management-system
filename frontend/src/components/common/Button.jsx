import { LoaderCircle } from 'lucide-react';

const variants = {
  primary:
    'bg-[var(--stm-accent)] text-white hover:bg-[var(--stm-accent-strong)] focus-visible:ring-[var(--stm-accent)]',
  secondary:
    'bg-white text-[var(--stm-ink)] border border-[var(--stm-border)] hover:bg-slate-50 focus-visible:ring-slate-300',
};

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
};

export default Button;
