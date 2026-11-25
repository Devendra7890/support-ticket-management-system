import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import PasswordField from '../../components/forms/PasswordField';
import TextField from '../../components/forms/TextField';
import { useAuth } from '../../hooks/useAuth';
import { validateLoginForm } from '../../utils/authValidation';
import { getPostAuthPath } from '../../utils/roles';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateLoginForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const session = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      toast.success('Welcome back');
      navigate(getPostAuthPath(session.user.role), { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-[var(--stm-border)] bg-white/95 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--stm-accent)]">
          Sign in
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--stm-ink)]">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-[var(--stm-muted)]">
          Access your support workspace with your account credentials.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <TextField
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <PasswordField
          id="password"
          label="Password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
          required
        />

        <Button type="submit" loading={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--stm-muted)]">
        New here?{' '}
        <Link to="/register" className="font-semibold text-[var(--stm-accent)] hover:underline">
          Create an account
        </Link>
      </p>
    </section>
  );
};

export default LoginPage;
