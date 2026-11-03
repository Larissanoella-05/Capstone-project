import { LogOut } from 'lucide-react';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { LogoMark } from './Brand.jsx';

/**
 * Ink sidebar: wordmark, role label, numbered items with a yellow active item, and the user card.
 * An item is `{ to, label, end?, isActive?, badge? }`. `isActive(pathname)` overrides the default path match.
 */
export default function Sidebar({ homeTo, roleLabel, items, userName, onSignOut, className = '' }) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main"
      className={`on-ink flex shrink-0 flex-col gap-1.5 bg-ink px-4 py-6 md:sticky md:top-0 md:h-dvh md:w-60 ${className}`}
    >
      <Link to={homeTo} className="flex items-center gap-2.5 pb-[18px] pl-1.5 no-underline">
        <LogoMark inverse />
        <span className="heading-weight text-[19px] uppercase tracking-[0.03em] text-white">
          Umuriro
        </span>
      </Link>
      <div className="eyebrow px-3.5 pb-2.5 text-mute">{roleLabel}</div>

      <div className="grid grid-cols-2 gap-1.5 md:flex md:flex-col">
        {items.map((item, index) => {
          const active = item.isActive
            ? item.isActive(pathname)
            : Boolean(matchPath({ path: item.to, end: Boolean(item.end) }, pathname));
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3.5 py-3 text-xs font-medium uppercase tracking-[0.04em] no-underline ${
                active ? 'bg-yellow text-ink' : 'text-white hover:bg-white/10'
              }`}
            >
              <span className={`text-[11px] font-medium ${active ? 'text-ink' : 'text-mute'}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span
                  aria-label={`${item.badge} unread`}
                  className="flex h-5 min-w-5 items-center justify-center rounded-tag bg-yellow px-1 text-[11px] font-semibold text-ink"
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 rounded-control border border-grey px-3.5 py-3">
        <div className="min-w-0">
          <div className="eyebrow text-mute">Signed in as</div>
          <div className="heading-weight mt-0.5 truncate text-sm text-white">{userName}</div>
        </div>
        <button
          type="button"
          aria-label="Sign out"
          title="Sign out"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-grey bg-transparent text-white hover:bg-white/10"
          onClick={onSignOut}
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
