import { STEP_CARDS } from '../../lib/landingContent.js';
import { PathIcon } from './LandingBits.jsx';

const DELAYS = ['', 'lp-d2', 'lp-d3', 'lp-d4'];

/** Four cards that overlap the bottom of the hero. */
export default function StepCards({ seen }) {
  return (
    <section id="flow" className={`lp-sec lp-feat ${seen ? 'lp-seen' : ''}`}>
      <div
        className="lp-bgd lp-glow"
        aria-hidden="true"
        style={{ left: -200, top: 40, width: 700, height: 520 }}
      />
      <div
        className="lp-bgd lp-glowb"
        aria-hidden="true"
        style={{ right: -160, bottom: -40, width: 700, height: 520 }}
      />
      <div
        className="lp-bgd lp-pyl"
        aria-hidden="true"
        style={{ right: 30, bottom: 0, width: 200, height: 460, opacity: 0.8 }}
      />
      <div
        className="lp-circuit"
        aria-hidden="true"
        style={{ left: 0, right: 0, top: 120, bottom: 0 }}
      />
      <div className="lp-wrap lp-steps lp-grid lp-grid-180" style={{ marginTop: 0 }}>
        {STEP_CARDS.map((card, i) => (
          <div
            key={card.title}
            className={`lp-fc lp-rv ${DELAYS[i]} ${card.highlight ? 'lp-on' : ''}`}
          >
            <PathIcon path={card.icon} size={46} viewBox={26} stroke="var(--y)" strokeWidth={1.6} />
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}
