import React from 'react';
import { useTranslation } from '../locales/TranslationContext';

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="relative group">
      {/* Container with glassmorphism */}
      <div className="flex items-center space-x-1 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/30 dark:border-white/20 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
        
        {/* Khmer Button */}
        <button
          onClick={() => changeLanguage('km')}
          className={`relative px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-400 overflow-hidden ${
            language === 'km'
              ? 'text-white'
              : 'text-white/80 dark:text-gray-200 hover:text-white'
          }`}
          style={{
            transform: language === 'km' ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {/* Active background gradient */}
          {language === 'km' && (
            <>
              <span className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-lg animate-gradient"></span>
              <span className="absolute inset-0 bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-500 rounded-lg opacity-0 animate-pulse-glow"></span>
              {/* Shimmer effect */}
              <span className="absolute inset-0 overflow-hidden rounded-lg">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></span>
              </span>
            </>
          )}
          
          {/* Hover background */}
          <span className={`absolute inset-0 bg-white/10 rounded-lg transition-opacity duration-300 ${
            language === 'km' ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
          }`}></span>
          
          {/* Text with icon */}
          <span className="relative flex items-center space-x-1 sm:space-x-1.5 z-10">
            <span className="text-sm sm:text-base">🇰🇭</span>
            <span className="tracking-wide hidden xs:inline">ខ្មែរ</span>
            <span className="tracking-wide xs:hidden">KM</span>
          </span>
          
          {/* Active indicator dot */}
          {language === 'km' && (
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full shadow-lg animate-ping-slow"></span>
          )}
        </button>

        {/* Divider */}
        <div className="h-4 sm:h-6 w-px bg-white/30 dark:bg-white/20"></div>

        {/* English Button */}
        <button
          onClick={() => changeLanguage('en')}
          className={`relative px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-400 overflow-hidden ${
            language === 'en'
              ? 'text-white'
              : 'text-white/80 dark:text-gray-200 hover:text-white'
          }`}
          style={{
            transform: language === 'en' ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {/* Active background gradient */}
          {language === 'en' && (
            <>
              <span className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-lg animate-gradient"></span>
              <span className="absolute inset-0 bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-500 rounded-lg opacity-0 animate-pulse-glow"></span>
              {/* Shimmer effect */}
              <span className="absolute inset-0 overflow-hidden rounded-lg">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></span>
              </span>
            </>
          )}
          
          {/* Hover background */}
          <span className={`absolute inset-0 bg-white/10 rounded-lg transition-opacity duration-300 ${
            language === 'en' ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
          }`}></span>
          
          {/* Text with icon */}
          <span className="relative flex items-center space-x-1 sm:space-x-1.5 z-10">
            <span className="text-sm sm:text-base">🇬🇧</span>
            <span className="tracking-wide">EN</span>
          </span>
          
          {/* Active indicator dot */}
          {language === 'en' && (
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 rounded-full shadow-lg animate-ping-slow"></span>
          )}
        </button>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        button:active {
          transform: scale(0.95) !important;
        }

        /* Add box-shadow glow on active */
        button:active span:first-child {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .animate-shimmer {
            animation: shimmer 3s infinite;
          }
          
          .animate-gradient {
            animation: gradient 4s ease infinite;
          }
        }

        /* Extra small screens */
        @media (max-width: 400px) {
          button {
            min-width: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;