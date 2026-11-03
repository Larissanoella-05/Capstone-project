import { ROLES } from '../../lib/landingContent.js';
import { ArrowUpRight, LoginLink } from './LandingBits.jsx';

const DELAYS = ['', 'lp-d2', 'lp-d3'];

export default function Roles({ seen }) {
  return (
    <section id="roles" className={`lp-sec ${seen ? 'lp-seen' : ''}`}>
      <div
        className="lp-bgd lp-pyl"
        aria-hidden="true"
        style={{ left: -20, bottom: 0, width: 220, height: 500, opacity: 0.9 }}
      />
      <div
        className="lp-bgd lp-pyl"
        aria-hidden="true"
        style={{ right: -20, bottom: 0, width: 220, height: 500, opacity: 0.9 }}
      />
      <div
        className="lp-bgd lp-glow"
        aria-hidden="true"
        style={{ left: '25%', top: -220, width: 800, height: 520 }}
      />
      <div
        className="lp-bgd lp-cbl lp-flip"
        aria-hidden="true"
        style={{ right: 0, top: 60, width: 120, height: 80 }}
      />
      <div className="lp-wrap">
        <div className="lp-center">
          <span className="lp-eyebrow lp-rv">{ROLES.eyebrow}</span>
          <h2 className="lp-h2 lp-rv lp-d2">{ROLES.title}</h2>
        </div>
        <div className="lp-grid lp-grid-260">
          {ROLES.items.map((item, i) => (
            <LoginLink
              key={item.title}
              className={`lp-rc lp-rv ${DELAYS[i]} ${item.highlight ? 'lp-on' : ''}`}
              link={item.link}
            >
              <div className={`lp-im lp-img lp-img-${item.image}`} />
              <div className="lp-info">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <span className="lp-go">
                  {item.go} <ArrowUpRight />
                </span>
              </div>
            </LoginLink>
          ))}
        </div>
      </div>
    </section>
  );
}
