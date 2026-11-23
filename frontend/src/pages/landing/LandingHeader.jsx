import { useT, useTranslated } from '../../context/LanguageContext.jsx';
import {
  DASHBOARD_MENU as DASHBOARD_MENU_COPY,
  HOTLINE,
  HOTLINE_HREF,
  HOTLINE_TEXT,
  NAV_ITEMS as NAV_ITEMS_COPY,
  REPORT_LINK,
} from '../../lib/landingContent.js';
import LanguageSwitch from '../../components/LanguageSwitch.jsx';
import { ArrowUpRight, Bolt, LoginLink, PhoneIcon } from './LandingBits.jsx';

export default function LandingHeader() {
  const t = useT();
  const NAV_ITEMS = useTranslated(NAV_ITEMS_COPY);
  const DASHBOARD_MENU = useTranslated(DASHBOARD_MENU_COPY);

  return (
    <header className="lp-hdr lp-dark">
      <a className="lp-logo" href="#top">
        <Bolt />
        UMURIRO
      </a>
      <nav className="lp-nav" aria-label={t('Main')}>
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
        <LanguageSwitch dark />
        <a
          className="lp-call"
          href={HOTLINE_HREF}
          aria-label={t('Call {hotline}', { hotline: HOTLINE })}
        >
          <PhoneIcon />
          <span className="lp-call-text">{t(HOTLINE_TEXT)}</span>
        </a>
        <LoginLink className="lp-btn" link={REPORT_LINK}>
          {t('Report a fault')} <ArrowUpRight />
        </LoginLink>
      </div>
    </header>
  );
}
