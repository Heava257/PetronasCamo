// នៅក្នុង AutoLogoutContext.jsx (ឬ App.js)
import { useEffect } from 'react';
import { request } from '../../../util/helper';

// បន្ថែម code នេះនៅក្នុង AutoLogoutProvider ឬ App component
useEffect(() => {
  const handleLogout = async () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (token) {
      try {
        // ✅ Call logout API
        await request('auth/logout', 'post', { 
          refresh_token: refreshToken 
        });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  // ✅ When user closes browser/tab
  const handleBeforeUnload = (e) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Use sendBeacon for reliable request
      const blob = new Blob(
        [JSON.stringify({ 
          refresh_token: localStorage.getItem('refresh_token') 
        })],
        { type: 'application/json' }
      );
      navigator.sendBeacon(
        'http://localhost:8080/api/auth/logout',
        blob
      );
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, []);