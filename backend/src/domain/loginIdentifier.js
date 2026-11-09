import { normaliseRwandanPhone } from '../utils/phone.js';

/**
 * What a customer typed in the "Email or phone" box. Anything with an @ is an email address, anything else must
 * be a Rwandan mobile number. Returns the field to look the account up by, or null if it is neither.
 * @param {unknown} input
 * @returns {{ email: string } | { phone: string } | null}
 */
export function parseLoginIdentifier(input) {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (text.includes('@')) {
    // Same shape check as the schema's email rule: something@something.tld, no spaces.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? { email: text.toLowerCase() } : null;
  }
  const phone = normaliseRwandanPhone(text);
  return phone ? { phone } : null;
}
