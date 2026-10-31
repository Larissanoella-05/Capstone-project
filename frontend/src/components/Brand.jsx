import { Zap } from 'lucide-react';

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

/** Black strip that reminds everyone this is a pilot and not the real fault line. */
export function PilotBanner() {
  return (
    <div className="eyebrow bg-ink px-3 py-1.5 text-center text-[10px] text-white">
      <span className="mr-2 bg-volt px-1.5 py-0.5 text-ink">Pilot</span>
      Test reports only. Real fault: call 2727.
    </div>
  );
}
