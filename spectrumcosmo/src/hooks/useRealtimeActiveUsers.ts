// hooks/useRealtimeActiveUsers.ts
import { useState, useEffect, useCallback } from 'react';

export function useRealtimeActiveUsers(timeRange: string = '15') {
  const [data, setData] = useState({ count: 0, users: [] });
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/active-users?timeRange=${timeRange}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      setIsConnected(false);
      console.error('Failed to fetch active users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  return { data, isConnected, isLoading, refresh: fetchUsers };
}
