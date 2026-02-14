import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from './en/translation.json';
import kmTranslations from './km/translation.json';

const TranslationContext = createContext();

const translations = {
  km: {
    ...kmTranslations,

    // POS Robust Fallbacks
    // "filtered_results": "លទ្ធផលដែលបានត្រង",
  },
  en: {
    ...enTranslations,

    // POS Robust Fallbacks
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
    if (!key) return '';

    const langData = translations[language] || translations['km'];

    // 1. Precise Match (Fastest)
    if (langData[key] !== undefined && typeof langData[key] === 'string') {
      return langData[key];
    }

    // 2. Nested Traversal (For localized objects)
    const keys = key.split('.');
    let result = langData;

    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k];
      } else {
        return key; // Fallback to raw key
      }
    }

    return typeof result === 'string' ? result : key;
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
