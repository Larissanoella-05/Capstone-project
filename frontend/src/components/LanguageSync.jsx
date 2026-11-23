import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../lib/api.js';
import { languageToSync } from '../lib/i18n.js';

/** Saves the language chosen on this device on the signed-in account, so notifications arrive in it. */
export default function LanguageSync() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const lastKey = useRef(null);

  useEffect(() => {
    const { key, send } = languageToSync(user, language, lastKey.current);
    lastKey.current = key;
    if (!send) return;
    // A failed save only means notifications stay in the old language until the next change.
    api('/auth/language', { method: 'PATCH', body: { language } }).catch(() => {});
  }, [user, language]);

  return null;
}
