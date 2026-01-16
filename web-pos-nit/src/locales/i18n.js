import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import kmTranslation from '../../src/locales/km/translation.json';
import enTranslation from '../../src/locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      km: { translation: kmTranslation },
      en: { translation: enTranslation }
    },
    fallbackLng: 'km',
    lng: localStorage.getItem('language') || 'km', // default language from storage or km
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;