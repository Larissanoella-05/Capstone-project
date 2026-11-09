// Rules and helpers for creating a customer account and for the "Email or phone" sign-in box.
import { isMeterNumber, normalisePhone } from './guestReport.js';

const MIN_PASSWORD = 8;

/** The same shape check as the API: something@something.tld with no spaces. */
export function looksLikeEmail(text) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(text).trim());
}

/**
 * What is wrong with the "Email or phone" box, or '' when it can be sent. Anything with an @ is an email address,
 * anything else must be a Rwandan mobile number, as on the API.
 * @param {string} text
 */
export function identifierError(text) {
  const value = text.trim();
  if (!value) return 'Enter your email or phone number.';
  if (value.includes('@')) return looksLikeEmail(value) ? '' : 'Enter a valid email address.';
  return normalisePhone(value) ? '' : 'Enter a Rwandan mobile number such as 078 123 4567.';
}

/**
 * Errors keyed by field, empty when the form can be sent. The location error is keyed `location`.
 * @param {{ name: string, phone: string, email: string, password: string, meterNumber: string, cell: string, point: object | null }} form
 * @returns {Record<string, string>}
 */
export function validateRegisterForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Enter your full name.';
  if (!normalisePhone(form.phone)) {
    errors.phone = 'Enter a Rwandan mobile number such as 078 123 4567.';
  }
  if (form.email.trim() && !looksLikeEmail(form.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (form.password.length < MIN_PASSWORD) {
    errors.password = `Use at least ${MIN_PASSWORD} characters for your password.`;
  }
  if (!isMeterNumber(form.meterNumber)) {
    errors.meterNumber = 'A meter number has 11 or 13 digits.';
  }
  if (!form.cell.trim()) errors.cell = 'Enter your cell.';
  if (!form.point) errors.location = 'Press "Use my location" so we can find your home on the map.';
  return errors;
}

/** The JSON body for POST /auth/register. Empty optional fields are left out; there is no role to send. */
export function buildRegisterPayload(form) {
  const body = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    password: form.password,
    meterNumber: form.meterNumber.trim(),
    cell: form.cell.trim(),
    latitude: form.point.latitude,
    longitude: form.point.longitude,
  };
  const email = form.email.trim();
  if (email) body.email = email;
  const village = form.village.trim();
  if (village) body.village = village;
  const landmark = form.landmark.trim();
  if (landmark) body.landmark = landmark;
  return body;
}
