import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { COORDINATOR_LINK, HERO, REPORT_LINK } from '../../lib/landingContent.js';
import { HEADER_HEIGHT, heroFrame, progressFor } from '../../lib/landingHero.js';
import { ArrowUpRight, Bolt, ChevronDown, LoginLink } from './LandingBits.jsx';

const TRAVEL = 2400; // scroll distance, in pixels, that plays the whole hero
const EASE = 0.16;

const LAYERS = ['mask', 'lineman', 'people', 'poles', 'head', 'tag', 'cta', 'cue'];

const px = (n) => `${n.toFixed(1)}px`;
const viewportHeight = () => Math.max(560, window.innerHeight || 800);

/** Writes one frame of the hero onto the layer elements. */
function paint(layers, frame) {
  const { mask, lineman, people, poles, head, tag, cta, cue } = layers;
  const origin = `${px(frame.mask.originX)} ${px(frame.mask.originY)}`;
  mask.style.display = frame.mask.visible ? 'block' : 'none';
  mask.style.transformOrigin = origin;
  mask.style.transform = `scale(${frame.mask.scale.toFixed(4)})`;
  lineman.style.transformOrigin = origin;
  lineman.style.transform = `scale(${frame.lineman.scale.toFixed(4)})`;
  people.style.opacity = frame.people.opacity.toFixed(3);
  people.style.visibility = frame.people.visible ? 'visible' : 'hidden';
  people.style.transform = `scale(${frame.people.scale.toFixed(4)})`;
  poles.style.transform = `translateY(${frame.poles.offsetPercent.toFixed(3)}%)`;
  head.style.opacity = frame.head.opacity.toFixed(3);
  head.style.transform = `translateY(${frame.head.offset.toFixed(2)}px)`;
  tag.style.opacity = frame.tag.opacity.toFixed(3);
  tag.style.transform = `translateY(${frame.tag.offset.toFixed(2)}px)`;
  cta.style.opacity = frame.cta.opacity.toFixed(3);
  cta.style.transform = `translateY(${frame.cta.offset.toFixed(2)}px)`;
  cta.style.pointerEvents = frame.cta.interactive ? 'auto' : 'none';
  cue.style.opacity = frame.cue.opacity.toFixed(3);
}

/** The sticky stage: a red "UMURIR" mask opens onto a photo, then "POWER", then the headline. */
export default function Hero({ reducedMotion }) {
  const heroRef = useRef(null);
  const stageRef = useRef(null);
  const [vh, setVh] = useState(viewportHeight);

  useLayoutEffect(() => {
    const layers = Object.fromEntries(
      LAYERS.map((name) => [name, stageRef.current.querySelector(`[data-layer="${name}"]`)])
    );
    let current = 0;
    let target = 0;
    let raf = 0;

    const size = () => ({
      width: stageRef.current.clientWidth,
      height: stageRef.current.clientHeight,
    });

    // With reduced motion the hero is one static screen showing the headline.
    if (reducedMotion) {
      const showFinal = () => {
        setVh(viewportHeight());
        paint(layers, heroFrame(1, size()));
      };
      showFinal();
      window.addEventListener('resize', showFinal);
      return () => window.removeEventListener('resize', showFinal);
    }

    const tick = () => {
      const distance = target - current;
      if (Math.abs(distance) < 0.0003) {
        current = target;
        paint(layers, heroFrame(current, size()));
        raf = 0;
        return;
      }
      current += distance * EASE;
      paint(layers, heroFrame(current, size()));
      raf = requestAnimationFrame(tick);
    };

    const measure = () => {
      target = progressFor(heroRef.current.getBoundingClientRect().top, TRAVEL);
      setVh(viewportHeight());
      if (!raf) raf = requestAnimationFrame(tick);
    };

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [reducedMotion]);

  const stageHeight = vh - HEADER_HEIGHT;

  return (
    <section
      id="top"
      ref={heroRef}
      className="lp-hero lp-dark"
      style={{ height: stageHeight + (reducedMotion ? 0 : TRAVEL) }}
    >
      <div ref={stageRef} className="lp-stage" style={{ height: stageHeight }}>
        <div
          data-layer="lineman"
          className="lp-layer lp-img lp-img-tower"
          style={{ transform: 'scale(1.3)' }}
          role="img"
          aria-label="A lineman looking up at a pylon"
        >
          <div
            className="lp-shade"
            style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.2), rgba(0,0,0,.05))' }}
          />
        </div>
        <div
          data-layer="poles"
          className="lp-layer lp-img lp-img-silhouette"
          style={{ transform: 'translateY(100%)' }}
          aria-hidden="true"
        >
          <div
            className="lp-shade"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,0,0,.5), rgba(0,0,0,.25) 45%, rgba(0,0,0,.65))',
            }}
          />
        </div>

        <div
          data-layer="people"
          className="lp-layer"
          style={{ opacity: 0, visibility: 'hidden' }}
          aria-hidden="true"
        >
          <div className="lp-people lp-hd">
            <span>P</span>
            <Bolt size="0.74em" />
            <span>WER</span>
          </div>
        </div>

        <div data-layer="mask" className="lp-layer" aria-hidden="true">
          <svg
            viewBox="0 0 1440 780"
            preserveAspectRatio="xMidYMid meet"
            width="100%"
            height="100%"
            style={{ display: 'block' }}
          >
            <defs>
              <mask
                id="lp-hole"
                maskUnits="userSpaceOnUse"
                x="-2500"
                y="-2500"
                width="6440"
                height="5780"
              >
                <rect x="-2500" y="-2500" width="6440" height="5780" fill="#fff" />
                <circle cx="1210" cy="390" r="46" fill="#000" />
              </mask>
            </defs>
            <g mask="url(#lp-hole)">
              <rect x="-2500" y="-2500" width="6440" height="5780" style={{ fill: 'var(--y)' }} />
              <g transform="translate(420 90) scale(20)">
                <path d="M17.5 1.5L5 17h7.5l-2 11.5L23 13h-7.5z" fill="#fff" fillOpacity=".1" />
              </g>
              <text
                x="150"
                y="480"
                textLength="964"
                lengthAdjust="spacingAndGlyphs"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="800"
                fontSize="250"
                fill="#fff"
              >
                UMURIR
              </text>
              <circle cx="1210" cy="390" r="88" fill="#fff" />
            </g>
          </svg>
        </div>

        <div
          data-layer="head"
          className="lp-layer"
          style={{ opacity: 0, pointerEvents: 'none', color: '#fff' }}
        >
          <div className="lp-head">
            <h1 className="lp-h1">
              {HERO.headline.map((word) => (
                <Fragment key={word}>
                  {word}
                  <br />
                </Fragment>
              ))}
              <span>{HERO.accentWord}</span>
            </h1>
            <h2 data-layer="tag" className="lp-tag" style={{ opacity: 0 }}>
              {HERO.tagline}
            </h2>
            <div data-layer="cta" className="lp-ctas" style={{ opacity: 0, pointerEvents: 'none' }}>
              <LoginLink className="lp-btn" link={REPORT_LINK}>
                Report a fault <ArrowUpRight />
              </LoginLink>
              <LoginLink className="lp-btn lp-ghost" link={COORDINATOR_LINK}>
                Open coordinator view
              </LoginLink>
            </div>
          </div>
        </div>

        <div data-layer="cue" className="lp-cue lp-hd" aria-hidden="true">
          Scroll
          <ChevronDown size={16} />
        </div>
      </div>
    </section>
  );
}
