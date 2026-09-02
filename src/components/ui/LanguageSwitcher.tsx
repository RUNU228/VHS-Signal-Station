import { useLanguage } from "@/components/LanguageProvider";
import { languages } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="language-switcher" role="group" aria-label={t.station.language}>
      {languages.map(({ code, label, short }) => (
        <button
          key={code}
          type="button"
          lang={code}
          title={label}
          aria-label={label}
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
        >
          {short}
        </button>
      ))}
    </div>
  );
}
