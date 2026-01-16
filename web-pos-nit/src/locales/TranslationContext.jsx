import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from './en/translation.json';
import kmTranslations from './km/translation.json';

const TranslationContext = createContext();

const translations = {
  km: {
    ...kmTranslations,
},
  en: {
    ...enTranslations,
}
};

// Translation Provider Component
export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'km';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const changeLanguage = (lng) => {
    setLanguage(lng);
  };

  return (
    <TranslationContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to use translation
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
};