const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

function haversineKm(a, b) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Straight-line distance in kilometres between two {latitude, longitude} points. */
export function distanceKm(a, b) {
  if (!a || !b) return null;
  return Math.round(haversineKm(a, b) * 10) / 10;
}

/** Straight-line distance in whole metres, for measuring how close a technician got to a service point. */
export function distanceMetres(a, b) {
  if (!a || !b) return null;
  return Math.round(haversineKm(a, b) * 1000);
}
