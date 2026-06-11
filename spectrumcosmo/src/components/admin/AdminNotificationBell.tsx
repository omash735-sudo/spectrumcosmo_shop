// components/admin/AdminNotificationBell.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AdminNotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications/unread-count');
      const data = await res.json();
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Failed to fetch admin unread count');
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchUnreadCount]);

  return (
    <button
      onClick={() => router.push('/admin/notifications')}
      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      aria-label="Admin Notifications"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
