import { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import Backdrop from './Backdrop.jsx';
import { LogoMark, PilotBanner } from './Brand.jsx';

/** The frame for pages anyone can open, with no account: the report form and the tracking page. */
export default function PublicShell() {
  // A tracking link is a key, so other sites may see where the visitor came from but never the path.
  // Not 'no-referrer': the map's tile server refuses requests that carry no Referer at all.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'strict-origin';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <div className="relative flex min-h-dvh flex-col bg-paper">
      <Backdrop />
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <PilotBanner />
        <header className="flex items-center justify-between gap-3 px-5 py-3 md:px-8">
          <Link to="/" className="flex min-h-11 items-center gap-3 text-ink no-underline">
            <LogoMark />
            <span className="heading-weight text-xl tracking-[-0.02em]">Umuriro</span>
          </Link>
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-accent"
          >
            Sign in
          </Link>
        </header>
        <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-3.5 px-5 pb-8 pt-3 md:gap-6 md:px-8 md:pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
