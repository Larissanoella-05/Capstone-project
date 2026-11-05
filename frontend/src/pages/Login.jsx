import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext.jsx';
import Backdrop from '../components/Backdrop.jsx';
import { LogoMark, PilotBanner } from '../components/Brand.jsx';
import { Field } from '../components/Field.jsx';
import { FormError } from '../components/States.jsx';
import { isDemoLogin } from '../lib/demo.js';

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

function PilotArea({ className = '' }) {
  return (
    <div className={`panel flex-col gap-2 px-[18px] py-4 ${className}`}>
      <div className="eyebrow">Pilot area</div>
      <div className="heading-weight text-base">Ndera Sector</div>
      <div className="text-xs text-grey">Gasabo, Kigali</div>
      <div className="text-xs font-medium">Real fault? Call 2727</div>
    </div>
  );
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(ROLES[0]);
  const [email, setEmail] = useState(DEMO ? ROLES[0].email : '');
  const [password, setPassword] = useState(DEMO ? DEMO_PASSWORD : '');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

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
      const signedIn = await login(email.trim(), password);
      const wanted = location.state?.from;
      const home = HOME_BY_ROLE[signedIn.role];
      navigate(wanted && wanted.startsWith(home) ? wanted : home, { replace: true });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-paper">
      <Backdrop />
      <div className="relative z-[1]">
        <PilotBanner />
      </div>
      <div className="relative z-[1] mx-auto grid w-full max-w-5xl flex-1 content-start gap-[18px] px-5 pb-7 pt-8 lg:grid-cols-2 lg:content-center lg:items-center lg:gap-16 lg:py-12">
        <div className="flex flex-col gap-[18px]">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="heading-weight text-2xl tracking-[-0.02em]">Umuriro</div>
          </div>
          <div className="eyebrow text-accent">Electricity fault response</div>
          <h1 className="display text-[28px] lg:text-5xl">
            Report a fault and follow the response.
          </h1>
          <PilotArea className="hidden lg:flex" />
        </div>

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
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className="field"
              value={password}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'password-error' : DEMO ? 'password-help' : undefined
              }
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <FormError>{formError}</FormError>

          <button type="submit" className="btn btn-accent btn-lg w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <PilotArea className="flex lg:hidden" />
      </div>
    </div>
  );
}
