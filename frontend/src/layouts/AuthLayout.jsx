import { Headphones } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[var(--stm-bg)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.12),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_35%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2.5 text-[var(--stm-ink)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--stm-accent)] text-white">
              <Headphones className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-wide">Humanli Helpdesk</p>
              <p className="text-xs text-[var(--stm-muted)]">Support Ticket Management</p>
            </div>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
