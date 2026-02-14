import React, { useState, useEffect } from 'react';

const KhmerTimeGreeting = () => {
  const [greeting, setGreeting] = useState('');
  const [icon, setIcon] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 12) {
        setGreeting('អរុណសួស្តី');
        setIcon('🌅');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('ថ្ងៃត្រង់សួស្តី');
        setIcon('☀️');
      } else if (hour >= 17 && hour < 20) {
        setGreeting('ល្ងាចសួស្តី');
        setIcon('🌆');
      } else {
        setGreeting('រាត្រីសួស្តី');
        setIcon('🌙');
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Check screen size for responsive visibility
  useEffect(() => {
    const checkScreenSize = () => {
      setIsVisible(window.innerWidth >= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Don't render on mobile screens to save space
  if (!isVisible) return null;

  return (
    <div className="khmer-greeting-container">
      <span className="khmer-greeting flex items-center space-x-1.5 text-white dark:text-gray-200 font-medium text-xs sm:text-sm md:text-base">
        <span className="greeting-icon text-base sm:text-lg" role="img" aria-label="greeting">
          {icon}
        </span>
        <span className="greeting-text hidden md:inline">{greeting}</span>
        <span className="greeting-text-short md:hidden">
          {greeting.substring(0, 8)}
        </span>
      </span>
      
      <style>{`
        .khmer-greeting-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .khmer-greeting {
          font-family: 'Khmer OS', 'Hanuman', sans-serif;
          white-space: nowrap;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          animation: fadeIn 0.5s ease-in;
        }

        .greeting-icon {
          animation: iconBounce 2s ease-in-out infinite;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes iconBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.1);
          }
        }

        @media (max-width: 1024px) {
          .khmer-greeting {
            font-size: 0.875rem;
          }
          
          .greeting-icon {
            font-size: 1rem;
          }
        }

        @media (max-width: 768px) {
          .khmer-greeting {
            font-size: 0.75rem;
          }
          
          .greeting-icon {
            font-size: 0.875rem;
          }
        }

        @media (max-width: 640px) {
          .khmer-greeting {
            font-size: 0.7rem;
          }
          
          .greeting-icon {
            font-size: 0.8rem;
            animation: iconBounce 3s ease-in-out infinite;
          }
        }
      `}</style>
    </div>
  );
};

export default KhmerTimeGreeting;