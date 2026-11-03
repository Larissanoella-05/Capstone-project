import { useState } from 'react';
import { Bell, LogOut, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

/** The square bolt mark. `inverse` is the accent-on-white variant used on dark backgrounds. */
export function LogoMark({ inverse = false }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-card ${inverse ? 'bg-white text-accent' : 'bg-accent text-on-accent'}`}
    >
      <Zap size={22} strokeWidth={2} aria-hidden="true" />
    </div>
  );
}

const PILOT_KEY = 'umuriro.pilotBannerDismissed';

function wasDismissed() {
  try {
    return sessionStorage.getItem(PILOT_KEY) === '1';
  } catch {
    return false;
  }
}

/** Black strip that reminds everyone this is a pilot and not the real fault line. Dismissible for the visit. */
export function PilotBanner() {
  const [hidden, setHidden] = useState(wasDismissed);
  if (hidden) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(PILOT_KEY, '1');
    } catch {
      // The banner just comes back on the next page load.
    }
    setHidden(true);
  }

  return (
    <div className="flex items-center gap-2 overflow-x-clip bg-ink pl-5 text-[11px] font-medium text-white">
      <span className="shrink-0 rounded-tag bg-accent px-2 py-0.5 font-semibold uppercase text-on-accent">
        Pilot
      </span>
      <span className="min-w-0 flex-1 py-2 uppercase">
        Test reports only. Real fault: call 2727
      </span>
      {/* 32px wide so the text fits one line on a phone; the pseudo-element keeps a 44px tap area */}
      <button
        type="button"
        aria-label="Hide the pilot notice"
        className="relative -my-1.5 flex h-11 w-8 shrink-0 cursor-pointer items-center justify-center bg-transparent text-white after:absolute after:-inset-x-1.5 after:inset-y-0 after:content-['']"
        onClick={dismiss}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Top bar for the customer and technician: logo, wordmark, alerts bell and sign out. */
export function AppHeader({ homeTo, notificationsTo, unread = 0, onSignOut }) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-white/90 px-5 py-3">
      <Link to={homeTo} className="flex items-center gap-2.5 no-underline">
        <LogoMark />
        <span className="heading-weight text-xl tracking-[-0.02em]">Umuriro</span>
      </Link>
      <div className="flex items-center">
        <Link
          to={notificationsTo}
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          className="relative flex h-11 w-11 items-center justify-center"
        >
          <Bell size={26} strokeWidth={1.75} aria-hidden="true" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent"
            />
          )}
        </Link>
        <button
          type="button"
          aria-label="Sign out"
          title="Sign out"
          className="flex h-11 w-11 cursor-pointer items-center justify-center bg-transparent text-grey"
          onClick={onSignOut}
        >
          <LogOut size={20} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
