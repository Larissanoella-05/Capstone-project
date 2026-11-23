import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGE_KEY, parseLanguage, translate, translateDeep } from '../lib/i18n.js';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (text, params) => translate('en', text, params),
});

export function LanguageProvider({ children }) {
  const [language, setChosen] = useState('en');

  // The saved choice arrives a moment after the first screen; until then the app is in English.
  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(LANGUAGE_KEY)
      .then((saved) => {
        if (!cancelled) setChosen(parseLanguage(saved));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((next) => {
    const value = parseLanguage(next);
    setChosen(value);
    SecureStore.setItemAsync(LANGUAGE_KEY, value).catch((error) =>
      console.warn('[language] could not save the choice:', error.message)
    );
  }, []);

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
