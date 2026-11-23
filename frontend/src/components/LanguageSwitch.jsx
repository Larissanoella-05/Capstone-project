import { useLanguage } from '../context/LanguageContext.jsx';
import { LANGUAGES } from '../lib/i18n.js';

/** EN | RW toggle. `dark` is for the landing page's dark header. */
export default function LanguageSwitch({ dark = false }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div
      role="group"
      aria-label={t('Language')}
      className={`inline-flex overflow-hidden rounded-control border text-xs font-bold ${
        dark ? 'border-white/40' : 'border-border'
      }`}
    >
      {LANGUAGES.map((item) => {
        const active = item.code === language;
        return (
          <button
            key={item.code}
            type="button"
            lang={item.code}
            aria-pressed={active}
            aria-label={item.label}
            onClick={() => setLanguage(item.code)}
            className={`min-h-9 min-w-10 cursor-pointer border-0 px-2.5 ${
              active
                ? 'bg-accent text-on-accent'
                : dark
                  ? 'bg-transparent text-white'
                  : 'bg-white text-ink'
            }`}
          >
            {item.short}
          </button>
        );
      })}
    </div>
  );
}
