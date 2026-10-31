import { TRACKED_STATUSES, distanceMeters, shouldPostLocation } from './location.js';

const origin = { latitude: -1.9495, longitude: 30.171 };
// About 111,320 m per degree of latitude, so these offsets are close to the stated distances.
const north = (meters) => ({
  latitude: origin.latitude + meters / 111320,
  longitude: origin.longitude,
});
const last = { ...origin, postedAt: 1_000_000 };

describe('distanceMeters', () => {
  it('is zero for the same point and about right for a known offset', () => {
    expect(distanceMeters(origin, origin)).toBe(0);
    expect(distanceMeters(origin, north(100))).toBeCloseTo(100, 0);
  });
});

describe('shouldPostLocation', () => {
  it('always posts the first fix', () => {
    expect(shouldPostLocation(null, origin, 1_000_000)).toBe(true);
  });

  it('does not post 10 s later, however far the phone moved', () => {
    expect(shouldPostLocation(last, north(500), 1_010_000)).toBe(false);
  });

  it('does not post 20 s later when only 10 m away', () => {
    expect(shouldPostLocation(last, north(10), 1_020_000)).toBe(false);
  });

  it('posts 20 s later and 30 m away', () => {
    expect(shouldPostLocation(last, north(30), 1_020_000)).toBe(true);
  });

  it('posts when both thresholds are exactly at the limit', () => {
    const next = north(25.5);
    expect(distanceMeters(origin, next)).toBeGreaterThanOrEqual(25);
    expect(shouldPostLocation(last, next, 1_015_000)).toBe(true);
  });

  it('does not post one millisecond short of the time limit', () => {
    expect(shouldPostLocation(last, north(30), 1_014_999)).toBe(false);
  });
});

describe('TRACKED_STATUSES', () => {
  it('covers travelling and on site, not ASSIGNED or RESOLVED', () => {
    expect(TRACKED_STATUSES).toEqual(['ON_THE_WAY', 'ARRIVED', 'WORKING']);
    expect(TRACKED_STATUSES).not.toContain('ASSIGNED');
    expect(TRACKED_STATUSES).not.toContain('RESOLVED');
  });
});
