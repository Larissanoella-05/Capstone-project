import { Link } from 'react-router-dom';

/** Tabs are `{ to, label, icon, isActive }`; a numeric badge marks `unreadPath` when `unread` is above 0. */
export default function BottomNav({ tabs, pathname, unreadPath, unread = 0 }) {
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-[1000] grid h-(--nav-h) box-content border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => {
        const active = tab.isActive(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={active ? 'page' : undefined}
            className={`relative flex min-h-11 flex-col items-center justify-center gap-[3px] text-[11px] no-underline ${
              active ? 'font-bold text-accent' : 'font-medium text-mute'
            }`}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-6 top-0 h-[3px] rounded-b-[3px] bg-accent"
              />
            )}
            <span className="relative">
              <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
              {tab.to === unreadPath && unread > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-on-accent"
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
