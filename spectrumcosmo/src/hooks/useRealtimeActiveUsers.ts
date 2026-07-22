// hooks/useRealtimeActiveUsers.ts
import { useState, useEffect } from 'react';

export function useRealtimeActiveUsers(timeRange: string = '15') {
  const [data, setData] = useState({ count: 0, users: [] });
  const [isConnected, setIsConnected] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/active-users?timeRange=${timeRange}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setIsConnected(true);
      }
    } catch (err) {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  return { data, isConnected, refresh: fetchUsers };
}
