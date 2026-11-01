import { useState } from 'react';
import { HardHat, RadioTower, User } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext.jsx';
import { LogoMark } from '../components/Brand.jsx';
import { FormError } from '../components/States.jsx';
import { isDemoLogin } from '../lib/demo.js';

const DEMO = isDemoLogin(import.meta.env.VITE_DEMO_LOGIN);
const DEMO_PASSWORD = 'demo1234';
const ROLES = [
  {
    key: 'CUSTOMER',
    label: 'Customer',
    icon: User,
    email: 'aline@demo.rw',
    person: 'Aline Mukamana',
    blurb: 'Report a fault and follow the response.',
  },
  {
    key: 'TECHNICIAN',
    label: 'Technician',
    icon: HardHat,
    email: 'jeanclaude@demo.rw',
    person: 'Jean Claude Habimana',
    blurb: 'See assigned jobs, navigate and update the status.',
  },
  {
    key: 'COORDINATOR',
    label: 'Service Coordinator',
    icon: RadioTower,
    email: 'grace@demo.rw',
    person: 'Grace Ingabire',
    blurb: 'Receive reports, assign technicians and monitor progress.',
  },
];

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
    <div className="flex min-h-dvh flex-col bg-white lg:flex-row">
      <div className="on-ink flex flex-col justify-between gap-12 bg-ink p-6 text-white sm:p-10 lg:flex-[1_1_55%]">
        <div className="flex items-center gap-3">
          <LogoMark inverse />
          <div className="text-lg font-black uppercase">Umuriro</div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="eyebrow text-volt">Electricity fault response</div>
          <h1 className="display text-[clamp(3rem,8vw,6.5rem)]">
            Report.
            <br />
            Locate.
            <br />
            <span className="text-volt">Respond.</span>
          </h1>
          <p className="m-0 max-w-[450px] text-base leading-normal text-line">
            Power out in Ndera? Tell us where. A technician is sent to your registered location and
            you can follow them on the map.
          </p>
        </div>

        <div className="grid grid-cols-3 border border-steel">
          {[
            ['Pilot area', 'Ndera Sector'],
            ['District', 'Gasabo, Kigali'],
            ['Real faults', 'Call 2727'],
          ].map(([label, value], index) => (
            <div key={label} className={`p-3 ${index > 0 ? 'border-l border-steel' : ''}`}>
              <div className="eyebrow text-ash">{label}</div>
              <div className="mt-1 text-sm font-bold">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-10 lg:flex-[1_1_45%]">
        <form onSubmit={onSubmit} noValidate className="flex w-full max-w-md flex-col gap-6">
          <div>
            <div className="eyebrow text-muted">Sign in</div>
            <h2 className="display mt-2 text-[40px]">Login</h2>
          </div>

          {DEMO && (
            <div className="flex flex-col gap-2">
              <div className="eyebrow" id="role-label">
                Demo role
              </div>
              <div
                role="group"
                aria-labelledby="role-label"
                className="grid grid-cols-3 border border-ink"
              >
                {ROLES.map((item, index) => {
                  const Icon = item.icon;
                  const active = item.key === role.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => chooseRole(item)}
                      className={`flex min-h-24 cursor-pointer flex-col gap-3 p-3 text-left ${index > 0 ? 'border-l border-ink' : ''} ${
                        active ? 'bg-volt' : 'bg-white hover:bg-paper'
                      }`}
                    >
                      <Icon size={20} aria-hidden="true" />
                      <span className="text-sm font-black uppercase leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="m-0 text-sm text-muted">
                {role.blurb} Signing in as {role.person}.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="eyebrow">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="field"
              value={email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email && (
              <span id="email-error" className="text-sm font-semibold text-danger">
                {errors.email}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="eyebrow">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="field"
              value={password}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'password-error' : DEMO ? 'password-help' : undefined
              }
              onChange={(event) => setPassword(event.target.value)}
            />
            {errors.password ? (
              <span id="password-error" className="text-sm font-semibold text-danger">
                {errors.password}
              </span>
            ) : DEMO ? (
              <span id="password-help" className="text-sm text-muted">
                Prototype: every demo account uses the password{' '}
                <span className="font-mono">demo1234</span>.
              </span>
            ) : null}
          </div>

          <FormError>{formError}</FormError>

          <button type="submit" className="btn btn-volt btn-lg w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
