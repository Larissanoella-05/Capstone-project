import { LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogoMark } from './Brand.jsx';

const LINKS = [
  { to: '/coordinator', label: 'Dashboard', end: true },
  { to: '/coordinator/faults', label: 'Fault Management' },
  { to: '/coordinator/monitoring', label: 'Live Monitoring' },
  { to: '/coordinator/analytics', label: 'Analytics' },
];

/** Desktop frame for the service coordinator. The sidebar stacks on top on a narrow screen. */
export default function CoordinatorShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col bg-white md:flex-row">
      <nav aria-label="Main" className="flex shrink-0 flex-col border-b border-ink md:w-64 md:border-b-0 md:border-r">
        <div className="flex h-[72px] items-center gap-3 border-b border-ink px-5">
          <LogoMark />
          <div>
            <div className="text-lg font-black uppercase leading-none">Umuriro</div>
            <div className="eyebrow mt-1 text-muted">Fault Response</div>
          </div>
        </div>
        <div className="eyebrow hidden px-5 pb-2 pt-5 text-muted md:block">Service Coordinator</div>
        <div className="grid grid-cols-2 md:block">
          {LINKS.map((link, index) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex h-12 items-center gap-3 border-line px-5 text-sm font-bold uppercase no-underline md:border-t ${
                  index === LINKS.length - 1 ? 'md:border-b' : ''
                } ${isActive ? 'bg-ink text-white' : 'hover:bg-paper'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`font-mono text-[11px] font-medium ${isActive ? 'text-line' : 'text-muted'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink px-5 py-4">
          <div>
            <div className="eyebrow text-muted">Signed in as</div>
            <div className="mt-1 text-sm font-bold">{user?.name}</div>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            className="flex h-10 w-10 cursor-pointer items-center justify-center border border-ink bg-white hover:bg-paper"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="eyebrow bg-ink px-4 py-1.5 text-center text-white">
          <span className="mr-2 bg-volt px-1.5 py-0.5 text-ink">Pilot</span>
          Test reports only. For a real fault call 2727.
        </div>
        <main className="flex w-full max-w-[1400px] flex-col gap-8 px-4 pb-12 pt-6 md:px-8 md:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Title block used at the top of every coordinator page. */
export function CoordinatorHeading({ eyebrow, title, children, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-5">
      <div>
        <div className="eyebrow text-muted">{eyebrow}</div>
        <h1 className="display mt-2 text-[clamp(2rem,5vw,3rem)]">{title}</h1>
        {children}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
