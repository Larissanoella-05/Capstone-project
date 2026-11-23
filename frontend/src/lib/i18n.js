// Two languages. The English text is the key, so a missing translation shows English instead of a blank.
import { RW } from './messages.rw.js';

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'rw', label: 'Kinyarwanda', short: 'RW' },
];
export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_KEY = 'umuriro.language';

const TABLES = { en: {}, rw: RW };

export const isLanguage = (value) => LANGUAGES.some((language) => language.code === value);

/** Reads the saved choice back; anything unexpected gives English. */
export const parseLanguage = (value) => (isLanguage(value) ? value : DEFAULT_LANGUAGE);

/**
 * `text` in the chosen language, with {name} placeholders filled from `params`.
 * @param {string} language 'en' or 'rw'
 * @param {string} text the English text
 * @param {Record<string, string | number>} [params]
 */
export function translate(language, text, params) {
  const found = TABLES[language]?.[text] ?? text;
  if (!params) return found;
  return found.replace(/\{(\w+)\}/g, (whole, name) =>
    params[name] === undefined ? whole : String(params[name])
  );
}

/** The default `t` for helpers: English, with placeholders filled. */
export const plain = (text, params) => translate('en', text, params);

// Keys whose strings are links, icons or image names, never words.
const NOT_TEXT = new Set(['icon', 'image', 'href', 'to', 'link']);

/**
 * A copy of `data` (strings, arrays and plain objects) with every word-string translated.
 * Links, icons and image names are left alone, and a text with no entry stays English.
 */
export function translateDeep(language, data) {
  if (typeof data === 'string') return translate(language, data);
  if (Array.isArray(data)) return data.map((item) => translateDeep(language, item));
  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        NOT_TEXT.has(key) ? value : translateDeep(language, value),
      ])
    );
  }
  return data;
}

/** The strings translateDeep would translate, for a test that every one has an entry. */
export function textsIn(data) {
  if (typeof data === 'string') return [data];
  if (Array.isArray(data)) return data.flatMap(textsIn);
  if (data && typeof data === 'object') {
    return Object.entries(data).flatMap(([key, value]) =>
      NOT_TEXT.has(key) ? [] : textsIn(value)
    );
  }
  return [];
}

/** The same errors object with each message translated by `t`. */
export const translateErrors = (t, errors) =>
  Object.fromEntries(Object.entries(errors).map(([key, message]) => [key, t(message)]));

/**
 * Whether the language chosen on this device must be saved on the signed-in person's account, so that
 * their notifications are written in it. `lastKey` is the key from the previous call, to send once only.
 * @param {{ id: number, language?: string } | null} user
 * @param {string} language
 * @param {string | null} lastKey
 */
export function languageToSync(user, language, lastKey) {
  if (!user) return { key: null, send: false };
  const key = `${user.id}:${language}`;
  return { key, send: key !== lastKey && user.language !== language };
}
