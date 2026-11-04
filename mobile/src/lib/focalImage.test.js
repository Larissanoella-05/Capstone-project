import { coverFrame } from './focalImage.js';

describe('coverFrame', () => {
  it('fills the box exactly when the shapes match', () => {
    expect(coverFrame({ width: 300, height: 200 }, { width: 150, height: 100 })).toEqual({
      width: 150,
      height: 100,
      left: -0,
      top: -0,
    });
  });

  it('scales a wide picture to the box height and centres it by default', () => {
    const frame = coverFrame({ width: 1920, height: 1280 }, { width: 400, height: 400 });
    expect(frame.height).toBe(400);
    expect(frame.width).toBe(600);
    expect(frame.left).toBe(-100);
    expect(frame.top).toBe(-0);
  });

  it('moves the crop towards the focus point', () => {
    const image = { width: 1920, height: 1280 };
    const box = { width: 400, height: 400 };
    expect(coverFrame(image, box, { x: 0, y: 0.5 }).left).toBe(-0);
    expect(coverFrame(image, box, { x: 1, y: 0.5 }).left).toBe(-200);
    expect(coverFrame(image, box, { x: 0.35, y: 0.4 }).left).toBeCloseTo(-70);
  });

  it('scales a tall picture to the box width and crops it vertically', () => {
    const image = { width: 1100, height: 1650 };
    const frame = coverFrame(image, { width: 300, height: 225 }, { x: 0.5, y: 0.38 });
    expect(frame.width).toBeCloseTo(300);
    expect(frame.height).toBeCloseTo(450);
    expect(frame.top).toBeCloseTo(-85.5);
  });

  it('never leaves a gap: the image always covers the box', () => {
    const image = { width: 1920, height: 1116 };
    for (const box of [
      { width: 360, height: 440 },
      { width: 360, height: 240 },
      { width: 800, height: 200 },
    ]) {
      const frame = coverFrame(image, box, { x: 0.4, y: 0.4 });
      expect(frame.width).toBeGreaterThanOrEqual(box.width - 0.001);
      expect(frame.height).toBeGreaterThanOrEqual(box.height - 0.001);
      expect(frame.left).toBeLessThanOrEqual(0);
      expect(frame.left + frame.width).toBeGreaterThanOrEqual(box.width - 0.001);
      expect(frame.top + frame.height).toBeGreaterThanOrEqual(box.height - 0.001);
    }
  });
});
