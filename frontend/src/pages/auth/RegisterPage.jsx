import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import PasswordField from '../../components/forms/PasswordField';
import TextField from '../../components/forms/TextField';
import { useAuth } from '../../hooks/useAuth';
import { validateRegisterForm } from '../../utils/authValidation';
import { getPostAuthPath } from '../../utils/roles';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateRegisterForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const session = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      toast.success('Account created successfully');
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
          Register
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--stm-ink)]">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-[var(--stm-muted)]">
          Register as a support user. Admin accounts are provisioned securely by the system.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <TextField
          id="name"
          label="Full name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Jane Doe"
          autoComplete="name"
          required
        />

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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
        />

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Re-enter password"
          autoComplete="new-password"
          required
        />

        <Button type="submit" loading={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--stm-muted)]">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-[var(--stm-accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </section>
  );
};

export default RegisterPage;
