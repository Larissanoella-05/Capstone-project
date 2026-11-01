import { useState } from 'react';
import { X, Zap } from 'lucide-react';

/** The square bolt mark. `inverse` is the yellow-on-black variant used on the login panel. */
export function LogoMark({ inverse = false }) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center ${inverse ? 'bg-volt' : 'bg-ink'}`}
    >
      <Zap size={20} strokeWidth={0} fill={inverse ? '#0B0B0B' : '#FFD400'} aria-hidden="true" />
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
    <div className="eyebrow flex items-center justify-center gap-2 bg-ink pl-3 text-xs text-white">
      <span className="bg-volt px-1.5 py-0.5 text-ink">Pilot</span>
      <span className="py-1.5">
        <span className="sm:hidden">Real fault: call 2727</span>
        <span className="hidden sm:inline">Test reports only. Real fault: call 2727.</span>
      </span>
      <button
        type="button"
        aria-label="Hide the pilot notice"
        className="flex h-11 w-11 cursor-pointer items-center justify-center bg-transparent text-white"
        onClick={dismiss}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
