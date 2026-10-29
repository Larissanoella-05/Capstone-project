// Pure rules for when the technician's phone should post a position (no GPS code here, so it is easy to test).

/** Only these stages share a position: the technician is travelling to, or at, the site. */
export const TRACKED_STATUSES = ['ON_THE_WAY', 'ARRIVED', 'WORKING'];

const EARTH_RADIUS_M = 6371000;
const toRad = (degrees) => (degrees * Math.PI) / 180;

/** Great-circle distance in metres between two { latitude, longitude } points. */
export function distanceMeters(a, b) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * last: { latitude, longitude, postedAt } for the last position sent, or null before the first fix.
 * next: { latitude, longitude } for the new fix.
 * The first fix always posts. After that both thresholds must be met: enough time AND enough distance.
 */
export function shouldPostLocation(last, next, nowMs, { minMs = 15000, minMeters = 25 } = {}) {
  if (!last) return true;
  return nowMs - last.postedAt >= minMs && distanceMeters(last, next) >= minMeters;
}
