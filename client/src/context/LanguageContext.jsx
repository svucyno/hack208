import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('languagePreference') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('languagePreference', language);
  }, [language]);

  const t = (key) => {
    if (!translations[language] || !translations[language][key]) {
      // Fallback to English if translation is missing
      return translations['en'][key] || key;
    }
    return translations[language][key];
  };

  const toggleLanguage = () => {
    const langs = ['en', 'hi', 'te'];
    setLanguage((prev) => langs[(langs.indexOf(prev) + 1) % langs.length]);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
