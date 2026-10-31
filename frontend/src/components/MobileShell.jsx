import { Bell, LogOut } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { LogoMark, PilotBanner } from './Brand.jsx';

/**
 * Frame for the customer and the technician. It fills the screen like the coordinator's frame:
 * on a phone it is a brand bar on top with a tab bar at the bottom; from `md` up the tabs move to a
 * sidebar and the content uses the full width.
 */
export default function MobileShell({ base, tabs, roleLabel }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const notifications = useApi('/notifications', { interval: 6000 });
  const unread = notifications.data?.unread ?? 0;
  const notificationsPath = `${base}/notifications`;

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white md:flex-row">
      {/* Sidebar: tablet and desktop */}
      <nav aria-label="Main" className="hidden shrink-0 flex-col border-r border-ink md:sticky md:top-0 md:flex md:h-dvh md:w-64">
        <Link to={base} className="flex h-[72px] items-center gap-3 border-b border-ink px-5 no-underline">
          <LogoMark />
          <div>
            <div className="text-lg font-black uppercase leading-none">Umuriro</div>
            <div className="eyebrow mt-1 text-muted">Fault Response</div>
          </div>
        </Link>
        <div className="eyebrow px-5 pb-2 pt-5 text-muted">{roleLabel}</div>
        <div>
          {tabs.map((tab, index) => {
            const active = tab.isActive(pathname);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className={`flex h-12 items-center gap-3 border-t border-line px-5 text-sm font-bold uppercase no-underline ${
                  index === tabs.length - 1 ? 'border-b' : ''
                } ${active ? 'bg-ink text-white' : 'hover:bg-paper'}`}
              >
                <span className={`font-mono text-[11px] font-medium ${active ? 'text-line' : 'text-muted'}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">{tab.label}</span>
                {tab.to === notificationsPath && unread > 0 && (
                  <span
                    aria-label={`${unread} unread`}
                    className="flex h-5 min-w-5 items-center justify-center bg-volt px-1 font-mono text-[11px] font-medium text-ink outline outline-1 outline-ink"
                  >
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink px-5 py-4">
          <div className="min-w-0">
            <div className="eyebrow text-muted">Signed in as</div>
            <div className="mt-1 truncate text-sm font-bold">{user?.name}</div>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-ink bg-white hover:bg-paper"
            onClick={signOut}
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <PilotBanner />

        {/* Brand bar: phone only */}
        <header className="flex h-14 items-stretch justify-between border-b border-ink md:hidden">
          <Link to={base} className="flex items-center gap-3 px-4 no-underline">
            <LogoMark />
            <span className="text-lg font-black uppercase">Umuriro</span>
          </Link>
          <div className="flex">
            <Link
              to={notificationsPath}
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
              onClick={signOut}
            >
              <LogOut size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 pb-8 pt-5 md:gap-6 md:px-8 md:pb-12 md:pt-8">
          <Outlet context={{ reloadNotifications: notifications.reload }} />
        </main>

        {/* Tab bar: phone only */}
        <nav
          aria-label="Main"
          className="sticky bottom-0 z-[1000] grid border-t border-ink bg-white font-mono text-[10px] font-medium uppercase tracking-[0.08em] md:hidden"
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
