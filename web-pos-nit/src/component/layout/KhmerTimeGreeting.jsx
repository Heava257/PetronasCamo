import React, { useState, useEffect } from 'react';

const KhmerTimeGreeting = () => {
  const [greeting, setGreeting] = useState({ text: '', emoji: '' });

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting({ text: 'អរុណសួស្តី', emoji: '🌅' });
      } else if (hour >= 12 && hour < 17) {
        setGreeting({ text: 'ទិវាសួស្តី', emoji: '☀️' });
      } else if (hour >= 17 && hour < 20) {
        setGreeting({ text: 'សាយណ្ហសួស្តី', emoji: '🌆' });
      } else {
        setGreeting({ text: 'រាត្រីសួស្តី', emoji: '🌙' });
      }
    };

    updateGreeting();
    const intervalId = setInterval(updateGreeting, 60000); // Update every minute
    return () => clearInterval(intervalId);
  }, []);

  return (
    <span className="khmer-greeting flex items-center gap-2">
      <span className="animated-icon">{greeting.emoji}</span>
      <span className="text-white dark:text-gray-200">{greeting.text}</span>
    </span>
  );
};

export default KhmerTimeGreeting;