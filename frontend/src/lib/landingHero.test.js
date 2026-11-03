// Unit tests for the landing hero scroll maths. Run with: npm test
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, heroFrame, progressFor, smoothstep } from './landingHero.js';

const DESKTOP = { width: 1440, height: 780 };
const SIZES = [
  { width: 360, height: 560 },
  { width: 390, height: 700 },
  { width: 768, height: 960 },
  { width: 1440, height: 780 },
  { width: 1920, height: 1016 },
];
const STEPS = Array.from({ length: 101 }, (_, i) => i / 100);

describe('clamp and smoothstep', () => {
  it('clamp keeps values in 0..1', () => {
    assert.equal(clamp(-3), 0);
    assert.equal(clamp(0.4), 0.4);
    assert.equal(clamp(9), 1);
  });

  it('smoothstep is 0 before the range, 1 after, and 0.5 in the middle', () => {
    assert.equal(smoothstep(0.2, 0.4, 0.1), 0);
    assert.equal(smoothstep(0.2, 0.4, 0.9), 1);
    assert.ok(Math.abs(smoothstep(0.2, 0.4, 0.3) - 0.5) < 1e-9);
  });
});

describe('progressFor', () => {
  it('is 0 when the hero top touches the header and 1 after the travel', () => {
    assert.equal(progressFor(64, 2400), 0);
    assert.equal(progressFor(64 - 2400, 2400), 1);
    assert.equal(progressFor(500, 2400), 0);
    assert.equal(progressFor(-9000, 2400), 1);
  });

  it('is half way after half the travel', () => {
    assert.equal(progressFor(64 - 1200, 2400), 0.5);
  });
});

describe('heroFrame', () => {
  it('starts with the mask closed over the photo and the headline hidden', () => {
    const frame = heroFrame(0, DESKTOP);
    assert.equal(frame.mask.scale, 1);
    assert.equal(frame.mask.visible, true);
    assert.equal(frame.head.opacity, 0);
    assert.equal(frame.cue.opacity, 1);
  });

  it('hides the mask from 0.3 onwards', () => {
    assert.equal(heroFrame(0.29, DESKTOP).mask.visible, true);
    for (const p of [0.3, 0.5, 1]) assert.equal(heroFrame(p, DESKTOP).mask.visible, false);
  });

  it('shows the headline, tagline and buttons from 0.97', () => {
    for (const p of [0.97, 1]) {
      const frame = heroFrame(p, DESKTOP);
      assert.equal(frame.head.opacity, 1);
      assert.equal(frame.tag.opacity, 1);
      assert.equal(frame.cta.opacity, 1);
      assert.equal(frame.cta.interactive, true);
    }
  });

  it('never shrinks the mask as progress rises', () => {
    for (const size of SIZES) {
      let last = 0;
      for (const p of STEPS) {
        const { scale } = heroFrame(p, size).mask;
        assert.ok(scale >= last, `${size.width}x${size.height} at ${p}`);
        last = scale;
      }
    }
  });

  it('opens the hole far enough to cover the whole stage', () => {
    for (const size of SIZES) {
      const { scale } = heroFrame(0.3, size).mask;
      const unit = Math.min(size.width / 1440, size.height / 780);
      const holeRadius = 46 * unit * scale;
      assert.ok(
        holeRadius >= Math.hypot(size.width, size.height) / 2,
        `${size.width}x${size.height}`
      );
    }
  });

  it('keeps every value inside its range for phone to desktop sizes', () => {
    for (const size of SIZES) {
      for (const p of STEPS) {
        const f = heroFrame(p, size);
        for (const layer of [f.people, f.head, f.tag, f.cta, f.cue]) {
          assert.ok(layer.opacity >= 0 && layer.opacity <= 1);
        }
        assert.ok(f.lineman.scale >= 1 && f.lineman.scale <= 1.3);
        assert.ok(f.poles.offsetPercent >= 0 && f.poles.offsetPercent <= 100);
        assert.ok(f.people.scale > 0 && f.people.scale <= 8);
        assert.ok(Number.isFinite(f.mask.scale) && f.mask.scale >= 1);
      }
    }
  });

  it('clamps progress outside 0..1', () => {
    assert.deepEqual(heroFrame(-1, DESKTOP), heroFrame(0, DESKTOP));
    assert.deepEqual(heroFrame(2, DESKTOP), heroFrame(1, DESKTOP));
  });
});
