import { SAFETY_TIPS } from '../../lib/landingContent.js';

const DELAYS = ['', 'lp-d2', 'lp-d3'];

/** Three plain safety cards. They do not link anywhere, so they do not lift on hover. */
export default function SafetyTips({ seen }) {
  return (
    <section id="blog" className={`lp-sec ${seen ? 'lp-seen' : ''}`}>
      <div
        className="lp-bgd lp-cbl"
        aria-hidden="true"
        style={{ left: 0, top: 70, width: 120, height: 80 }}
      />
      <div
        className="lp-bgd lp-pyl"
        aria-hidden="true"
        style={{ right: -10, bottom: 0, width: 200, height: 460, opacity: 0.85 }}
      />
      <div
        className="lp-bgd lp-pyl"
        aria-hidden="true"
        style={{ left: '1%', bottom: 0, width: 150, height: 340, opacity: 0.5 }}
      />
      <div
        className="lp-bgd lp-glow"
        aria-hidden="true"
        style={{ right: '5%', top: -200, width: 700, height: 480 }}
      />
      <div className="lp-wrap">
        <div className="lp-center">
          <span className="lp-eyebrow lp-rv">{SAFETY_TIPS.eyebrow}</span>
          <h2 className="lp-h2 lp-rv lp-d2">{SAFETY_TIPS.title}</h2>
        </div>
        <div className="lp-grid lp-grid-270">
          {SAFETY_TIPS.items.map((tip, i) => (
            <article
              key={tip.title}
              className={`lp-bl lp-rv ${DELAYS[i]} ${tip.highlight ? 'lp-on' : ''}`}
            >
              <div className="lp-pic">
                <div className={`lp-im lp-img lp-img-${tip.image}`} />
              </div>
              <div className="lp-card-body">
                <h3>{tip.title}</h3>
                <p>{tip.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
