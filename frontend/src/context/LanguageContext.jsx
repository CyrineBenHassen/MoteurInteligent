import { createContext, useContext, useState } from 'react';
import translations from '../translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('nextest-lang') || 'en'
  );

  const setLanguage = (code) => {
    setLang(code);
    localStorage.setItem('nextest-lang', code);
    document.documentElement.setAttribute('dir', code === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', code);
  };

  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);