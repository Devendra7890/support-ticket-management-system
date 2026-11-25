import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const UserHomePage = () => {
  const { user } = useAuth();

  return (
    <section className="rounded-3xl border border-[var(--stm-border)] bg-white p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="mt-1 rounded-xl bg-cyan-50 p-2 text-[var(--stm-accent)]">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-[var(--stm-ink)]">
            Authentication ready
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--stm-muted)]">
            You are signed in as <span className="font-medium text-[var(--stm-ink)]">{user?.email}</span>.
            Ticket management UI arrives in the next phase. This screen confirms protected
            user routing works.
          </p>
        </div>
      </div>
    </section>
  );
};

export default UserHomePage;
