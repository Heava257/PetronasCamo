import { useState, useEffect, useCallback } from 'react';
import { request } from '../../../util/helper';

/**
 * Hook for fetching admin activity/online status
 */
export const useAdminActivity = (refreshInterval = 15000) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await request('admin/online-status', 'GET');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching admin activity:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
    
    if (refreshInterval) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, refreshInterval]);

  return {
    stats,
    loading,
    refresh,
    refreshStats: refresh
  };
};

/**
 * Hook for general online status
 */
export const useOnlineStatus = (refreshInterval = 15000) => {
  return useAdminActivity(refreshInterval);
};