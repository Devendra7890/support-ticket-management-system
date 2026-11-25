import { Headphones, LogOut } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';

const AppLayout = ({ title, subtitle }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
  };

  return (
    <div className="min-h-screen bg-[var(--stm-bg)]">
      <header className="border-b border-[var(--stm-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--stm-accent)] text-white">
              <Headphones className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--stm-ink)]">Humanli Helpdesk</p>
              <p className="text-xs text-[var(--stm-muted)]">
                {user?.name} · {user?.role}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-auto px-3 py-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--stm-ink)]">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-[var(--stm-muted)]">{subtitle}</p>
          ) : null}
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
