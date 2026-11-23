import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGE_KEY, parseLanguage, translate, translateDeep } from '../lib/i18n.js';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (text, params) => translate('en', text, params),
});

function loadLanguage() {
  try {
    return parseLanguage(localStorage.getItem(LANGUAGE_KEY));
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }) {
  const [language, setChosen] = useState(loadLanguage);

  const setLanguage = useCallback((next) => {
    const value = parseLanguage(next);
    setChosen(value);
    try {
      localStorage.setItem(LANGUAGE_KEY, value);
    } catch {
      // Storage can be blocked; the choice then lasts until the page is closed.
    }
  }, []);

  // Screen readers and the browser's own hyphenation and spell check follow the page language.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t: (text, params) => translate(language, text, params) }),
    [language, setLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
/** The `t` function for the current language. */
export const useT = () => useContext(LanguageContext).t;
/** `data` (landing copy and the like) with every word translated; memoised per language. */
export function useTranslated(data) {
  const { language } = useContext(LanguageContext);
  return useMemo(() => translateDeep(language, data), [language, data]);
}
