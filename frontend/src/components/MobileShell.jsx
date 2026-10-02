import { Bell, LogOut } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { LogoMark, PilotBanner } from './Brand.jsx';

/**
 * Phone-first frame for the customer and technician: brand bar on top,
 * tab bar at the bottom. On a wide screen it stays a centred column.
 */
export default function MobileShell({ base, tabs }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const notifications = useApi('/notifications', { interval: 6000 });
  const unread = notifications.data?.unread ?? 0;

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col border-ink bg-white sm:border-x">
        <PilotBanner />
        <header className="flex h-14 items-stretch justify-between border-b border-ink">
          <Link to={base} className="flex items-center gap-3 px-4 no-underline">
            <LogoMark />
            <span className="text-lg font-black uppercase">Umuriro</span>
          </Link>
          <div className="flex">
            <Link
              to={`${base}/notifications`}
              aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
              className="relative flex w-14 items-center justify-center border-l border-ink"
            >
              <Bell size={20} aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center bg-volt px-1 font-mono text-[11px] font-medium outline outline-1 outline-ink">
                  {unread}
                </span>
              )}
            </Link>
            <button
              type="button"
              aria-label="Sign out"
              title="Sign out"
              className="flex w-14 cursor-pointer items-center justify-center border-l border-ink bg-white"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-5 px-4 pb-8 pt-5">
          <Outlet context={{ reloadNotifications: notifications.reload }} />
        </main>

        <nav
          aria-label="Main"
          className="sticky bottom-0 z-[1000] grid border-t border-ink bg-white font-mono text-[10px] font-medium uppercase tracking-[0.08em]"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab, index) => {
            const active = tab.isActive(pathname);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className={`flex h-16 items-center justify-center no-underline ${index > 0 ? 'border-l border-ink' : ''} ${
                  active ? 'bg-ink text-white' : 'bg-white text-ink'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
