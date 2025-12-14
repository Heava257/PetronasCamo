import React, { useState, useEffect } from 'react';

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num) => num.toString().padStart(2, '0');

  let hour = time.getHours();
  const minutes = formatTime(time.getMinutes());
  const seconds = formatTime(time.getSeconds());

  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour === 0 ? 12 : hour;
  const formattedHour = formatTime(hour);

  return (
    <span className="live-clock text-white dark:text-gray-200 tabular-nums">
      {formattedHour}:{minutes}:{seconds} {period}
    </span>
  );
};

export default LiveClock;