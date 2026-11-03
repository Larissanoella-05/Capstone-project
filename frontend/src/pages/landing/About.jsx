import { ABOUT, HOTLINE, HOTLINE_HREF, REPORT_LINK } from '../../lib/landingContent.js';
import { ArrowUpRight, LoginLink, PathIcon, PhoneIcon } from './LandingBits.jsx';

export default function About({ seen }) {
  return (
    <section
      id="about"
      className={`lp-sec ${seen ? 'lp-seen' : ''}`}
      style={{ paddingTop: 40, paddingBottom: 100 }}
    >
      <div
        className="lp-bgd lp-glow"
        aria-hidden="true"
        style={{ right: -180, top: -80, width: 720, height: 560 }}
      />
      <div
        className="lp-bgd lp-cct"
        aria-hidden="true"
        style={{
          right: 0,
          top: 0,
          width: '55%',
          height: '100%',
          opacity: 0.55,
          maskImage: 'linear-gradient(90deg, transparent, #000)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000)',
        }}
      />
      <svg
        aria-hidden="true"
        width="230"
        height="520"
        viewBox="0 0 230 520"
        fill="none"
        stroke="#d3d3dc"
        strokeWidth="1.4"
        style={{ position: 'absolute', left: -20, bottom: 0, opacity: 0.9 }}
      >
        <path d="M70 520L108 40M170 520L132 40M100 120h40M88 200h64M78 280h84M70 360h100M70 440h100M108 40l-38 480M132 40l38 480M88 200l84 80M152 200l-84 80M78 280l92 80M162 280l-92 80M70 360l100 80M170 360l-100 80M20 90h190M40 90l68-50M190 90l-58-50M20 90l8 22M210 90l-8 22M40 140h150M52 140l8 20M178 140l-8 20" />
      </svg>
      <div className="lp-wrap lp-about-row">
        <div className="lp-collage lp-rv lp-rv-l">
          <div
            className="lp-collage-main lp-img lp-img-panel"
            role="img"
            aria-label="Technician testing a distribution board"
          />
          <div className="lp-collage-label">{ABOUT.imageLabel}</div>
          <div className="lp-collage-inset">
            <div
              className="lp-img lp-img-poles"
              role="img"
              aria-label="Power poles and lines over a street"
              style={{ position: 'absolute', inset: 0 }}
            />
          </div>
        </div>
        <div className="lp-about-copy">
          <span className="lp-eyebrow lp-rv">{ABOUT.eyebrow}</span>
          <h2 className="lp-h2 lp-rv lp-d2">
            {ABOUT.title[0]}
            <br />
            {ABOUT.title[1]}
          </h2>
          <p className="lp-rv lp-d3">{ABOUT.body}</p>
          <div className="lp-facts lp-rv lp-d4">
            {ABOUT.facts.map((fact) => (
              <div className="lp-fact" key={fact.title}>
                <span className="lp-mi">
                  <PathIcon path={fact.icon} />
                </span>
                <div>
                  <h4>{fact.title}</h4>
                  <p>{fact.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-about-actions lp-rv lp-d4">
            <LoginLink className="lp-btn" link={REPORT_LINK}>
              Report a fault <ArrowUpRight />
            </LoginLink>
            <a className="lp-callblock" href={HOTLINE_HREF}>
              <span className="lp-mi" style={{ width: 46, height: 46 }}>
                <PhoneIcon size={20} />
              </span>
              <span>
                <small>{ABOUT.callLabel}</small>
                <strong>Real fault? Call {HOTLINE}</strong>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
