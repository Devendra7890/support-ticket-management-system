import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Ticket,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import * as notificationService from '../services/notificationService';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isTicketsSectionActive =
    location.pathname === '/admin/tickets' ||
    /^\/admin\/tickets\/[^/]+$/.test(location.pathname);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const response = await notificationService.getNotifications({
          page: 1,
          limit: 1,
          isRead: false,
        });
        setUnreadCount(response.data?.pagination?.total || 0);
      } catch {
        setUnreadCount(0);
      }
    };

    loadUnread();
  }, [location.pathname]);

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    {
      to: '/admin/tickets',
      label: 'All Tickets',
      icon: Ticket,
      end: true,
      forceActive: isTicketsSectionActive,
    },
    {
      to: '/admin/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount,
    },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-[var(--stm-ink)]'
    }`;

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-2 pb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Headphones className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--stm-ink)]">Humanli Helpdesk</p>
          <p className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
            <Shield className="h-3 w-3" />
            Admin portal
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, end, forceActive, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              navLinkClass({ isActive: forceActive || isActive })
            }
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {badge > 0 ? (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {badge > 99 ? '99+' : badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 rounded-2xl border border-[var(--stm-border)] bg-slate-50 p-3">
        <p className="truncate text-sm font-semibold text-[var(--stm-ink)]">{user?.name}</p>
        <p className="truncate text-xs text-[var(--stm-muted)]">{user?.email}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {user?.role}
        </p>
        <Button variant="secondary" className="mt-3" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--stm-bg)] lg:flex">
      <aside className="hidden w-72 shrink-0 border-r border-[var(--stm-border)] bg-white p-5 lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-72 flex-col bg-white p-5 shadow-xl">
            <button
              type="button"
              className="mb-4 self-end rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--stm-border)] bg-white px-4 py-4 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Shield className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--stm-ink)]">Admin Portal</p>
              <p className="text-xs text-[var(--stm-muted)]">{user?.name}</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-[var(--stm-border)] p-2 text-slate-600"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
