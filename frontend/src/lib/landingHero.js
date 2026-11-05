// Progress 0..1 runs through the red mask opening, "POWER", then the headline.

export const HEADER_HEIGHT = 64;
// The mask artwork is drawn in a 1440x780 box with the hole at (1210, 390), radius 46.
const ART_W = 1440;
const ART_H = 780;
const HOLE_X = 1210;
const HOLE_R = 46;

export const clamp = (x) => Math.min(1, Math.max(0, x));

export function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Scroll progress of the hero: 0 when its top touches the header, 1 after `travel` pixels. */
export function progressFor(rectTop, travel, headerHeight = HEADER_HEIGHT) {
  return clamp((headerHeight - rectTop) / travel);
}

/**
 * Values for every hero layer at a given progress.
 * @param {number} progress 0..1
 * @param {{ width: number, height: number }} size the sticky stage in pixels
 */
export function heroFrame(progress, { width, height }) {
  const p = clamp(progress);
  const unit = Math.min(width / ART_W, height / ART_H);
  const originX = width / 2 + (HOLE_X - ART_W / 2) * unit;
  const originY = height / 2;
  const reach = Math.hypot(Math.max(originX, width - originX), Math.max(originY, height - originY));
  const maxScale = (reach / (HOLE_R * unit)) * 1.06;

  const open = clamp(p / 0.3);
  const peopleIn = smoothstep(0.32, 0.42, p);
  const peopleOut = smoothstep(0.5, 0.74, p);
  const peopleOpacity = peopleIn * (1 - smoothstep(0.56, 0.68, p));
  const head = smoothstep(0.74, 0.86, p);
  const tag = smoothstep(0.82, 0.92, p);
  const cta = smoothstep(0.88, 0.97, p);

  return {
    mask: {
      visible: p < 0.3,
      originX,
      originY,
      scale: Math.exp(Math.log(maxScale) * Math.pow(open, 1.5)),
    },
    lineman: { originX, originY, scale: 1.3 - 0.3 * smoothstep(0, 0.3, p) },
    people: {
      opacity: peopleOpacity,
      visible: peopleOpacity >= 0.002,
      scale: (0.85 + 0.15 * peopleIn) * (1 + 7 * peopleOut),
    },
    poles: { offsetPercent: (1 - smoothstep(0.5, 0.72, p)) * 100 },
    head: { opacity: head, offset: (1 - head) * -40 },
    tag: { opacity: tag, offset: (1 - tag) * -30 },
    cta: { opacity: cta, offset: (1 - cta) * -24, interactive: cta > 0.6 },
    cue: { opacity: 1 - smoothstep(0, 0.05, p) },
  };
}
