// The words of every in-app notification, in each language a user can choose. Pure: no I/O.

/** @type {['en', 'rw']} */
export const LANGUAGES = ['en', 'rw'];
export const DEFAULT_LANGUAGE = 'en';

/** @type {Record<string, Record<string, [title: string, message: string]>>} */
const TEXT = {
  FAULT_SUBMITTED: {
    en: [
      'Fault received',
      'We have received your electricity fault report #{reference}. A service coordinator will assign a technician.',
    ],
    rw: [
      'Ikibazo cyakiriwe',
      "Twakiriye raporo y'ikibazo cy'amashanyarazi #{reference}. Umuhuzabikorwa agiye kugenera umutekinisiye.",
    ],
  },
  TECHNICIAN_ASSIGNED: {
    en: [
      'Technician assigned',
      '{technician} has been assigned to your electricity fault #{reference}.',
    ],
    rw: [
      'Umutekinisiye yabonetse',
      "{technician} yagenewe ikibazo cyawe cy'amashanyarazi #{reference}.",
    ],
  },
  JOB_ASSIGNED: {
    en: ['New job assigned', 'Fault #{reference} at {cell} Cell has been assigned to you.'],
    rw: ['Wahawe akazi gashya', 'Wahawe ikibazo #{reference} mu kagari ka {cell}.'],
  },
  TECHNICIAN_ON_THE_WAY: {
    en: [
      'Technician on the way',
      '{technician} is on the way to your service location for fault #{reference}.',
    ],
    rw: [
      'Umutekinisiye ari mu nzira',
      '{technician} ari mu nzira agana aho utuye ku kibazo #{reference}.',
    ],
  },
  TECHNICIAN_ARRIVED: {
    en: [
      'Technician arrived',
      '{technician} has arrived at your service location for fault #{reference}.',
    ],
    rw: ['Umutekinisiye yageze', '{technician} yageze aho utuye ku kibazo #{reference}.'],
  },
  FAULT_RESOLVED: {
    en: [
      'Fault resolved',
      'Your electricity fault #{reference} is fixed. If the power is still off, report it again.',
    ],
    rw: [
      'Ikibazo cyakemutse',
      "Ikibazo cyawe cy'amashanyarazi #{reference} cyakosowe. Niba umuriro utaragaruka, ongera utange raporo.",
    ],
  },
  FAULT_CANCELLED: {
    en: [
      'Report cancelled',
      'Your fault report #{reference} was cancelled by the service coordinator.',
    ],
    rw: ['Raporo yahagaritswe', "Raporo yawe #{reference} yahagaritswe n'umuhuzabikorwa."],
  },
};

const SOMEONE = { en: 'A technician', rw: 'Umutekinisiye' };

export const isLanguage = (value) => LANGUAGES.includes(value);

/** The name to use when the technician is not known yet. */
export const aTechnician = (language) =>
  SOMEONE[isLanguage(language) ? language : DEFAULT_LANGUAGE];

/**
 * Title and message for one kind of notification, with {placeholders} filled from `params`.
 * An unknown language gives English, and an unknown type throws: a typo must not send a blank alert.
 * @param {string} type
 * @param {string} language 'en' or 'rw'
 * @param {Record<string, string | number>} params
 */
export function noticeText(type, language, params = {}) {
  const entry = TEXT[type];
  if (!entry) throw new Error(`No notification text for ${type}`);
  const [title, message] = entry[isLanguage(language) ? language : DEFAULT_LANGUAGE];
  const fill = (text) =>
    text.replace(/\{(\w+)\}/g, (whole, name) =>
      params[name] === undefined ? whole : String(params[name])
    );
  return { title: fill(title), message: fill(message) };
}
