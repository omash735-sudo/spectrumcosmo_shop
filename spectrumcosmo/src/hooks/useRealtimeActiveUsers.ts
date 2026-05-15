'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface ActiveUser {
  session_id: string;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  page_url: string;
  user_agent: string;
  ip_address: string;
  last_seen: string;
  seconds_ago: number;
  device_type: string;
  browser: string;
}

interface ActiveUsersData {
  count: number;
  users: ActiveUser[];
  timestamp: string;
}

export function useRealtimeActiveUsers() {
  const [data, setData] = useState<ActiveUsersData>({ count: 0, users: [], timestamp: '' });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/admin/dashboard/active-users-stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        if (parsedData.error) {
          setError(parsedData.error);
        } else {
          setData(parsedData);
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError('Connection lost. Reconnecting...');
      eventSource.close();
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          connect();
        }
      }, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  const refresh = useCallback(() => {
    // Force reconnect to get fresh data
    connect();
  }, [connect]);

  return { data, isConnected, error, refresh };
}
