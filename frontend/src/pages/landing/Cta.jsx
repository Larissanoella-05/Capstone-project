import { CTA, HOTLINE_HREF, REPORT_LINK } from '../../lib/landingContent.js';
import { ArrowUpRight, LoginLink } from './LandingBits.jsx';

export default function Cta({ seen }) {
  return (
    <section id="cta" className={`lp-sec lp-alt lp-cta-sec ${seen ? 'lp-seen' : ''}`}>
      <div className="lp-bgd lp-cct" aria-hidden="true" style={{ inset: 0, opacity: 0.8 }} />
      <div
        className="lp-bgd lp-pyl"
        aria-hidden="true"
        style={{ left: 0, bottom: 0, width: 190, height: 440, opacity: 0.8 }}
      />
      <div
        className="lp-bgd lp-pyl"
        aria-hidden="true"
        style={{ right: 0, bottom: 0, width: 190, height: 440, opacity: 0.8 }}
      />
      <div
        className="lp-bgd lp-cbl"
        aria-hidden="true"
        style={{ right: 0, bottom: 30, width: 120, height: 80, transform: 'scaleX(-1)' }}
      />
      <div className="lp-cta lp-rv">
        <div className="lp-cta-copy">
          <h2>
            {CTA.title[0]}
            <br />
            {CTA.title[1]}
          </h2>
          <p>{CTA.body}</p>
          <div className="lp-ctas">
            <LoginLink className="lp-btn lp-white" link={REPORT_LINK}>
              {CTA.signIn} <ArrowUpRight />
            </LoginLink>
            <a className="lp-btn lp-ghost" href={HOTLINE_HREF}>
              {CTA.call}
            </a>
          </div>
        </div>
        <div className="lp-cta-art">
          <div
            className="lp-cta-photo lp-img lp-img-tower"
            role="img"
            aria-label="Lineman looking up at a pole"
          />
        </div>
      </div>
    </section>
  );
}
