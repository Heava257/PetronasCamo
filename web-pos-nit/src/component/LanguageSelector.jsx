// LanguageSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸'
    },
    {
      code: 'km',
      name: 'ខ្មែរ',
      flag: '🇰🇭'
    }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

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

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
    // Save language preference to localStorage
    localStorage.setItem('language', languageCode);
  };

  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
          isDarkMode
            ? 'bg-gray-700 text-white hover:bg-gray-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title={t('language.selectLanguage')}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:block text-sm font-medium">
          {currentLanguage.name}
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
        <div className={`absolute right-0 mt-2 w-40 rounded-md shadow-lg z-50 ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`flex items-center gap-3 px-4 py-2 text-sm w-full text-left transition-colors ${
                  currentLanguage.code === language.code
                    ? (isDarkMode
                        ? 'bg-gray-700 text-blue-300'
                        : 'bg-blue-50 text-blue-600')
                    : (isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-50')
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {currentLanguage.code === language.code && (
                  <span className="ml-auto text-blue-500">✓</span>
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