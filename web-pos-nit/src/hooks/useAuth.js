// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { getAcccessToken, getProfile } from '../store/profile.store';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAcccessToken();
      const profile = getProfile();
      setIsAuthenticated(!!(token && profile));
    };

    // Check initially
    checkAuth();

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e) => {
      if (e.key === 'access_token' || e.key === 'profile') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { isAuthenticated };
};