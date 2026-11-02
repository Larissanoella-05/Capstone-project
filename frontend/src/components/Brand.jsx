import { useState } from 'react';
import { Bell, LogOut, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

/** The square bolt mark. `inverse` is the ink-on-yellow variant used on dark backgrounds. */
export function LogoMark({ inverse = false }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${inverse ? 'bg-yellow text-ink' : 'bg-ink text-yellow'}`}
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
    <div className="flex items-center gap-2.5 bg-ink pl-5 text-[11px] font-medium text-white">
      <span className="shrink-0 rounded-tag bg-yellow px-2 py-0.5 font-semibold uppercase text-ink">
        Pilot
      </span>
      <span className="min-w-0 flex-1 py-2 uppercase">
        Test reports only. Real fault: call 2727
      </span>
      {/* The tap area is 44px; the negative margin keeps the strip as slim as the design */}
      <button
        type="button"
        aria-label="Hide the pilot notice"
        className="-my-1.5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center bg-transparent text-white"
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
    <header className="flex items-center justify-between border-b border-line bg-white px-5 py-3.5">
      <Link to={homeTo} className="flex items-center gap-2.5 no-underline">
        <LogoMark />
        <span className="heading-weight text-xl uppercase tracking-[0.03em]">Umuriro</span>
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
              className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red"
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
