import { useT } from '../../context/LanguageContext.jsx';
import { COORDINATOR_LINK, HERO, HERO_HEADLINE, REPORT_LINK } from '../../lib/landingContent.js';
import { ArrowUpRight, LoginLink } from './LandingBits.jsx';
import LandingHeader from './LandingHeader.jsx';

export default function Hero() {
  const t = useT();

  return (
    <section id="top" className="lp-hero">
      <img
        className="lp-hero-img"
        src="/landing/silhouette.jpg"
        alt={t(
          'Silhouette of a lineworker in a hard hat and harness climbing a timber frame, with a crane behind'
        )}
      />
      <div className="lp-hero-shade" aria-hidden="true" />
      <LandingHeader />
      <div className="lp-hero-body">
        <div className="lp-hero-text">
          <h1>{t(HERO_HEADLINE)}</h1>
          <p>{t(HERO.tagline)}</p>
          <div className="lp-hero-actions">
            <LoginLink className="lp-btn" link={REPORT_LINK}>
              {t('Report a fault')} <ArrowUpRight />
            </LoginLink>
            <LoginLink className="lp-hero-link" link={COORDINATOR_LINK}>
              {t('Open coordinator view')}
            </LoginLink>
          </div>
        </div>
      </div>
    </section>
  );
}
