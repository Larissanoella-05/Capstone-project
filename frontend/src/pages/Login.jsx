import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext.jsx';
import { LogoMark, PilotBanner } from '../components/Brand.jsx';
import { Field } from '../components/Field.jsx';
import { FormError } from '../components/States.jsx';
import { isDemoLogin } from '../lib/demo.js';
import { postLoginPath } from '../lib/landingLinks.js';

const DEMO = isDemoLogin(import.meta.env.VITE_DEMO_LOGIN);
const DEMO_PASSWORD = 'demo1234';
const ROLES = [
  {
    key: 'CUSTOMER',
    label: 'Customer',
    email: 'aline@demo.rw',
    person: 'Aline Mukamana',
  },
  {
    key: 'TECHNICIAN',
    label: 'Technician',
    email: 'jeanclaude@demo.rw',
    person: 'Jean Claude Habimana',
  },
  {
    key: 'COORDINATOR',
    label: 'Coordinator',
    email: 'grace@demo.rw',
    person: 'Grace Ingabire',
  },
];

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();

  const [role, setRole] = useState(ROLES[0]);
  const [email, setEmail] = useState(DEMO ? ROLES[0].email : '');
  const [password, setPassword] = useState(DEMO ? DEMO_PASSWORD : '');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Navigate to={postLoginPath(location.state?.from, user.role, HOME_BY_ROLE)} replace />;
  }

  function chooseRole(next) {
    setRole(next);
    setEmail(next.email);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    setFormError('');
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = 'Enter your email address.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="on-ink flex min-h-dvh flex-col bg-night">
      <PilotBanner />
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="relative flex h-[220px] flex-col justify-between overflow-hidden p-5 lg:h-auto lg:p-10">
          <img
            src="/landing/silhouette.jpg"
            alt="Silhouette of a lineworker in a hard hat and harness climbing a timber frame, with a crane behind"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-night via-night/50 to-night/20"
          />
          <Link
            to="/"
            className="relative flex min-h-11 items-center gap-3 self-start text-white no-underline"
          >
            <LogoMark />
            <span className="heading-weight text-2xl tracking-[-0.02em]">Umuriro</span>
          </Link>
          <p className="display relative m-0 max-w-md text-xl text-white lg:text-[34px]">
            Assign technicians and keep every fault moving.
          </p>
        </div>

        <div className="flex items-start justify-center px-5 py-8 lg:items-center lg:p-12">
          <div className="w-full max-w-[440px] rounded-card bg-white p-6 text-ink shadow-lg sm:p-8">
            <h1 className="display text-[28px]">Sign in</h1>
            <p className="mb-6 mt-2 text-sm text-grey">
              Use the account created for you by your administrator.
            </p>

            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
              {DEMO && (
                <div className="flex flex-col gap-2">
                  <div className="eyebrow" id="role-label">
                    Signing in as
                  </div>
                  <div role="group" aria-labelledby="role-label" className="grid grid-cols-3 gap-2">
                    {ROLES.map((item) => {
                      const active = item.key === role.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => chooseRole(item)}
                          className={`min-h-11 cursor-pointer rounded-control border px-1 py-3 text-[13px] ${
                            active
                              ? 'border-accent bg-tint font-bold text-accent'
                              : 'border-border bg-white font-medium text-ink'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="m-0 text-xs text-grey">Signing in as {role.person}</p>
                </div>
              )}

              <Field id="email" label="Email" error={errors.email}>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your email"
                  className="field"
                  value={email}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>

              <Field
                id="password"
                label="Password"
                error={errors.password}
                help={
                  DEMO ? (
                    <>
                      Prototype: every demo account uses the password <strong>demo1234</strong>.
                    </>
                  ) : undefined
                }
              >
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="field pr-16"
                    value={password}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? 'password-error' : DEMO ? 'password-help' : undefined
                    }
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label="Show password"
                    aria-pressed={showPassword}
                    aria-controls="password"
                    className="absolute inset-y-0 right-0 min-w-11 cursor-pointer bg-transparent px-3 text-xs font-semibold text-grey focus-visible:outline-2 focus-visible:outline-accent"
                    onClick={() => setShowPassword((shown) => !shown)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </Field>

              <FormError>{formError}</FormError>

              <button type="submit" className="btn btn-accent btn-lg w-full" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-1 border-t border-line pt-4 text-xs text-grey">
              <p className="m-0">Need access? Ask your administrator to create your account.</p>
              <Link
                to="/"
                className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-accent focus-visible:outline-accent"
              >
                ← Back to Umuriro
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
