// src/components/LanguageSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { 
    code: 'km', 
    name: 'Khmer', 
    flag: '🇰🇭',
    nativeName: 'ខ្មែរ'
  },
  { 
    code: 'en', 
    name: 'English', 
    flag: '🇺🇸',
    nativeName: 'English'
  }
];

const LanguageSelector = ({ isDarkMode = false, className = '' }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    
    // Update document language attribute
    document.documentElement.lang = langCode;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isDarkMode
            ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
        }`}
        title={t('common.selectLanguage')}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium hidden sm:inline">
          {currentLanguage.nativeName}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50 border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="py-2">
            <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b ${
              isDarkMode 
                ? 'text-gray-400 border-gray-700' 
                : 'text-gray-500 border-gray-100'
            }`}>
              {t('common.selectLanguage')}
            </div>
            
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  i18n.language === language.code 
                    ? (isDarkMode
                        ? 'bg-blue-900 text-blue-300 border-r-2 border-blue-400' 
                        : 'bg-blue-50 text-blue-600 border-r-2 border-blue-600')
                    : (isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-50')
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{language.nativeName}</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {language.name}
                  </div>
                </div>
                {i18n.language === language.code && (
                  <div className={`w-2 h-2 rounded-full ${
                    isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                  }`} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;