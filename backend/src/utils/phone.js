// Rwandan mobile numbers: 072/073 (Airtel) and 078/079 (MTN), nine digits after the 0 or the 250 prefix.
const MOBILE = /^(?:250|0)(7[2389]\d{7})$/;

/**
 * Turns any usual way of writing a Rwandan mobile number into +2507XXXXXXXX, or null if it is not one.
 * @param {unknown} input
 * @returns {string | null}
 */
export function normaliseRwandanPhone(input) {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/[\s\-().]/g, '').replace(/^(\+|00)/, '');
  const match = MOBILE.exec(digits);
  return match ? `+250${match[1]}` : null;
}
