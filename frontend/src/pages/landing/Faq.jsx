import { useState } from 'react';
import { FAQ } from '../../lib/landingContent.js';
import { ChevronDown } from './LandingBits.jsx';

/** Two-column accordion: one answer open at a time, the first open to start. */
export default function Faq({ seen }) {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className={`lp-sec lp-alt ${seen ? 'lp-seen' : ''}`}>
      <div className="lp-bgd lp-cct" aria-hidden="true" style={{ inset: 0, opacity: 0.55 }} />
      <div
        className="lp-bgd lp-glowb"
        aria-hidden="true"
        style={{ left: -100, bottom: -100, width: 700, height: 500 }}
      />
      <svg
        aria-hidden="true"
        width="120"
        height="80"
        viewBox="0 0 120 80"
        style={{ position: 'absolute', left: 0, top: 70 }}
      >
        <path
          d="M0 52C34 52 46 22 86 30"
          stroke="#17171a"
          strokeWidth="24"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="92" cy="30" r="10" fill="#cfd8e3" />
        <circle cx="100" cy="26" r="4" fill="#e08a2c" />
        <circle cx="102" cy="34" r="4" fill="#3b82c4" />
      </svg>
      <div className="lp-wrap" style={{ maxWidth: 1100 }}>
        <div className="lp-center">
          <span className="lp-eyebrow lp-rv">{FAQ.eyebrow}</span>
          <h2 className="lp-h2 lp-rv lp-d2">{FAQ.title}</h2>
        </div>
        <div className="lp-faqg">
          {FAQ.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className={`lp-rv ${i % 2 ? 'lp-d2' : ''} ${isOpen ? 'lp-fqo' : ''}`}
              >
                <button
                  type="button"
                  className="lp-fq"
                  aria-expanded={isOpen}
                  aria-controls={`lp-faq-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span className="lp-no">{String(i + 1).padStart(2, '0')}</span>
                  {item.q}
                  <ChevronDown className="lp-ch" />
                </button>
                {isOpen && (
                  <p id={`lp-faq-${i}`} className="lp-fa">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
