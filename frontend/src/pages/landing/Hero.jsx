import { COORDINATOR_LINK, HERO, HERO_HEADLINE, REPORT_LINK } from '../../lib/landingContent.js';
import { ArrowUpRight, LoginLink } from './LandingBits.jsx';
import LandingHeader from './LandingHeader.jsx';

/** A still photo with the nav on top of it, the headline on the right and the lineworker on the left. */
export default function Hero() {
  return (
    <section id="top" className="lp-hero">
      <img
        className="lp-hero-img"
        src="/landing/silhouette.jpg"
        alt="Silhouette of a lineworker in a hard hat and harness climbing a timber frame, with a crane behind"
      />
      <div className="lp-hero-shade" aria-hidden="true" />
      <LandingHeader />
      <div className="lp-hero-body">
        <div className="lp-hero-text">
          <h1>{HERO_HEADLINE}</h1>
          <p>{HERO.tagline}</p>
          <div className="lp-hero-actions">
            <LoginLink className="lp-btn" link={REPORT_LINK}>
              Report a fault <ArrowUpRight />
            </LoginLink>
            <LoginLink className="lp-hero-link" link={COORDINATOR_LINK}>
              Open coordinator view
            </LoginLink>
          </div>
        </div>
      </div>
    </section>
  );
}
