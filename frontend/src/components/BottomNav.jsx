import { Link } from 'react-router-dom';

/**
 * Tab bar for the phone layout. Each tab is `{ to, label, icon, isActive }`.
 * The active tab is ink, the others are mute. A red dot marks `unreadPath` when `unread` is above 0.
 */
export default function BottomNav({ tabs, pathname, unreadPath, unread = 0 }) {
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-[1000] grid border-t border-line bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 md:hidden"
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
            className={`flex min-h-11 flex-col items-center gap-[3px] text-[11px] uppercase tracking-[0.05em] no-underline ${
              active ? 'font-semibold text-ink' : 'font-medium text-mute'
            }`}
          >
            <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
            <span className="relative">
              {tab.label}
              {tab.to === unreadPath && unread > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-2.5 -top-0.5 h-2 w-2 rounded-full bg-red"
                />
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
