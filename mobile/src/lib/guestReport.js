// Rules and helpers for reporting a fault without an account.

const MAX_DESCRIPTION = 1000;
const MAX_PLACE = 300;
const MAX_SAVED = 10;

/** The same rule as the API: Rwandan mobiles 072, 073, 078 and 079. Returns +2507XXXXXXXX or null. */
export function normalisePhone(input) {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/[\s\-().]/g, '').replace(/^(\+|00)/, '');
  const match = /^(?:250|0)(7[2389]\d{7})$/.exec(digits);
  return match ? `+250${match[1]}` : null;
}

/** A prepaid meter number has 11 or 13 digits. Only the length is checked; nothing can confirm it exists. */
export function isMeterNumber(value) {
  return /^(\d{11}|\d{13})$/.test(String(value).replace(/\s/g, ''));
}

/**
 * Errors keyed by field, empty when the form can be sent.
 * @param {{ category: string, contactPhone: string, point: object | null, placeText: string, claimedMeter: string, description: string }} form
 * @returns {Record<string, string>}
 */
export function validateGuestForm(form) {
  const errors = {};
  if (!form.category) errors.category = 'Choose the type of fault.';
  if (!normalisePhone(form.contactPhone)) {
    errors.contactPhone = 'Enter a Rwandan mobile number such as 078 123 4567.';
  }
  const place = form.placeText.trim();
  if (place.length > MAX_PLACE) {
    errors.location = `Shorten the place to ${MAX_PLACE} characters or fewer.`;
  } else if (!form.point && !place) {
    errors.location = 'Tell us where the fault is: use your location or describe the place.';
  }
  if (form.claimedMeter.trim() && !isMeterNumber(form.claimedMeter)) {
    errors.claimedMeter =
      'A meter number has 11 or 13 digits. Leave it empty if you do not know it.';
  }
  if (form.description.length > MAX_DESCRIPTION) {
    errors.description = `Shorten the description to ${MAX_DESCRIPTION} characters or fewer.`;
  }
  return errors;
}

/** The JSON body for POST /public/faults. Empty optional fields are left out. */
export function buildGuestPayload(form) {
  const body = { category: form.category, contactPhone: form.contactPhone.trim() };
  if (form.point) {
    body.latitude = form.point.latitude;
    body.longitude = form.point.longitude;
    if (form.point.accuracyM !== undefined) body.accuracyM = form.point.accuracyM;
  }
  const place = form.placeText.trim();
  if (place) body.placeText = place;
  const meter = form.claimedMeter.trim();
  if (meter) body.claimedMeter = meter;
  const description = form.description.trim();
  if (description) body.description = description;
  if (form.photo) body.photo = form.photo.dataUrl;
  return body;
}

/** Six decimals is about 10 cm, far finer than any phone can tell. */
const sixDecimals = (value) => Math.round(value * 1e6) / 1e6;

export function pointFromPosition({ coords }) {
  const point = {
    latitude: sixDecimals(coords.latitude),
    longitude: sixDecimals(coords.longitude),
  };
  if (Number.isFinite(coords.accuracy)) point.accuracyM = Math.round(coords.accuracy);
  return point;
}

/** How far to trust the point, in words. */
export function accuracyText(metres) {
  if (!Number.isFinite(metres)) return '';
  if (metres <= 50) return `Accurate to about ${metres} m`;
  if (metres < 1000) return `Roughly ${metres} m, check the place below`;
  return `Very rough, about ${(metres / 1000).toFixed(1)} km. Describe the place below`;
}

/** @param {number} code a GeolocationPositionError code: 1 denied, 2 unavailable, 3 timeout */
export function locationErrorMessage(code) {
  if (code === 1) {
    return 'Location is blocked for this site. Allow it in your browser settings, or describe the place below.';
  }
  if (code === 2) {
    return 'Your phone could not find its position. Try again outside, or describe the place below.';
  }
  if (code === 3) {
    return 'Finding your location took too long. Try again, or describe the place below.';
  }
  return 'Your location could not be used. Describe the place below.';
}

/** Newest first, no repeats, at most ten. */
export function rememberReport(list, entry) {
  return [entry, ...list.filter((item) => item.token !== entry.token)].slice(0, MAX_SAVED);
}

/** Reads the saved list back; anything unexpected gives an empty list. */
export function parseSavedReports(text) {
  try {
    const value = JSON.parse(text);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item) => item && typeof item.token === 'string' && typeof item.reference === 'string'
    );
  } catch {
    return [];
  }
}

export const trackingPath = (token) => `/track/${token}`;
export const SAVED_REPORTS_KEY = 'umuriro.guestReports';

/** Staff screens: a guest report has no customer, so say so instead of reading a missing name. */
export const reporterName = (fault) => fault.customer?.name ?? 'Guest reporter';
export const reporterPhone = (fault) => fault.contactPhone || fault.customer?.phone || '';
