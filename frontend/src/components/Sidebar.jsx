import { LogOut } from 'lucide-react';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { LogoMark } from './Brand.jsx';

/** An item is `{ to, label, icon?, end?, isActive?, badge? }`; `isActive(pathname)` overrides the default path match. */
export default function Sidebar({ homeTo, roleLabel, items, userName, onSignOut, className = '' }) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main"
      className={`relative z-[1] flex shrink-0 flex-col gap-1.5 border-r border-line bg-white px-4 py-6 md:sticky md:top-0 md:h-dvh md:w-62 ${className}`}
    >
      <Link to={homeTo} className="flex items-center gap-2.5 pb-3 pl-1.5 no-underline">
        <LogoMark />
        <span className="heading-weight text-[19px] tracking-[-0.02em]">Umuriro</span>
      </Link>
      <div className="eyebrow px-3.5 pb-2.5">{roleLabel}</div>

      <div className="grid grid-cols-2 gap-1.5 md:flex md:flex-col">
        {items.map((item) => {
          const active = item.isActive
            ? item.isActive(pathname)
            : Boolean(matchPath({ path: item.to, end: Boolean(item.end) }, pathname));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-11 items-center gap-3 rounded-control px-3.5 py-3 text-sm no-underline ${
                active ? 'bg-tint font-bold text-accent' : 'font-medium text-ink hover:bg-paper'
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent"
                />
              )}
              {Icon && <Icon size={20} strokeWidth={1.75} aria-hidden="true" />}
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span
                  aria-label={`${item.badge} unread`}
                  className="flex h-5 min-w-5 items-center justify-center rounded-tag bg-accent px-1 text-[11px] font-bold text-on-accent"
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 rounded-control border border-line bg-paper px-3.5 py-3">
        <div className="min-w-0">
          <div className="eyebrow">Signed in as</div>
          <div className="heading-weight mt-0.5 truncate text-sm">{userName}</div>
        </div>
        <button
          type="button"
          aria-label="Sign out"
          title="Sign out"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-line bg-white text-ink hover:bg-paper"
          onClick={onSignOut}
        >
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
