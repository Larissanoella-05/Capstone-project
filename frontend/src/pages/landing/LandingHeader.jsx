import {
  DASHBOARD_MENU,
  HOTLINE,
  HOTLINE_HREF,
  HOTLINE_TEXT,
  NAV_ITEMS,
  REPORT_LINK,
} from '../../lib/landingContent.js';
import { ArrowUpRight, Bolt, LoginLink, PhoneIcon } from './LandingBits.jsx';

export default function LandingHeader() {
  return (
    <header className="lp-hdr lp-dark">
      <a className="lp-logo" href="#top">
        <Bolt />
        UMURIRO
      </a>
      <nav className="lp-nav" aria-label="Main">
        {NAV_ITEMS.map((item) =>
          item.menu ? (
            <div className="lp-hm" key={item.label}>
              <a className="lp-nl" href={item.href}>
                {item.label}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M1 3l4 4 4-4" />
                </svg>
              </a>
              <div className="lp-menu">
                {DASHBOARD_MENU.map((entry) => (
                  <LoginLink key={entry.label} link={entry.link}>
                    {entry.label}
                  </LoginLink>
                ))}
              </div>
            </div>
          ) : (
            <a className="lp-nl" href={item.href} key={item.label}>
              {item.label}
            </a>
          )
        )}
      </nav>
      <div className="lp-hdr-end">
        <a className="lp-call" href={HOTLINE_HREF} aria-label={`Call ${HOTLINE}`}>
          <PhoneIcon />
          <span className="lp-call-text">{HOTLINE_TEXT}</span>
        </a>
        <LoginLink className="lp-btn" link={REPORT_LINK}>
          Report a fault <ArrowUpRight />
        </LoginLink>
      </div>
    </header>
  );
}
