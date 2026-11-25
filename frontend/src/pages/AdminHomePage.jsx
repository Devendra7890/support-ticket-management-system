import { Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AdminHomePage = () => {
  const { user } = useAuth();

  return (
    <section className="rounded-3xl border border-[var(--stm-border)] bg-white p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="mt-1 rounded-xl bg-slate-900/5 p-2 text-slate-800">
          <Shield className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-[var(--stm-ink)]">
            Admin access confirmed
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--stm-muted)]">
            Signed in as <span className="font-medium text-[var(--stm-ink)]">{user?.email}</span> with
            role <span className="font-medium text-[var(--stm-ink)]">{user?.role}</span>. Admin
            ticket management UI will be added later. Frontend route protection is UX-only;
            backend authorization remains the security boundary.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AdminHomePage;
