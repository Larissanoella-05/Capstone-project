import { SERVICES } from '../../lib/landingContent.js';
import { ArrowUpRight, LoginLink } from './LandingBits.jsx';

const DELAYS = ['', 'lp-d2', 'lp-d3', 'lp-d4'];

export default function Services({ seen }) {
  return (
    <section id="services" className={`lp-sec lp-alt ${seen ? 'lp-seen' : ''}`}>
      <div className="lp-bgd lp-cct" aria-hidden="true" style={{ inset: 0, opacity: 0.8 }} />
      <div
        className="lp-bgd lp-cbl"
        aria-hidden="true"
        style={{ left: 0, top: 60, width: 120, height: 80 }}
      />
      <div
        className="lp-bgd lp-pyl"
        aria-hidden="true"
        style={{ right: -10, bottom: 0, width: 210, height: 480, opacity: 0.9 }}
      />
      <div
        className="lp-bgd lp-pyl"
        aria-hidden="true"
        style={{ left: '2%', bottom: 0, width: 140, height: 320, opacity: 0.5 }}
      />
      <div
        className="lp-bgd lp-glowb"
        aria-hidden="true"
        style={{ left: '30%', top: -200, width: 800, height: 500 }}
      />
      <div className="lp-wrap">
        <div className="lp-center">
          <span className="lp-eyebrow lp-rv">{SERVICES.eyebrow}</span>
          <h2 className="lp-h2 lp-rv lp-d2">{SERVICES.title}</h2>
        </div>
        <div className="lp-grid lp-grid-250">
          {SERVICES.items.map((item, i) => (
            <LoginLink key={item.title} className={`lp-sv lp-rv ${DELAYS[i]}`} link={item.link}>
              <div className="lp-pic">
                <div className={`lp-im lp-img lp-img-${item.image}`} />
              </div>
              <div className="lp-card-body">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <span className="lp-lm">
                  Report this <ArrowUpRight size={11} />
                </span>
              </div>
            </LoginLink>
          ))}
        </div>
      </div>
    </section>
  );
}
