'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, BellOff, Package, Truck, CreditCard, Clock } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  action_url: string;
  action_label: string;
  is_read: boolean;
  created_at: string;
}

const iconMap: Record<string, any> = {
  delivery_confirmation: Package,
  order_update: Truck,
  payment_reminder: CreditCard,
  promotion: Bell,
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      >
        {unreadCount > 0 ? (
          <>
            <Bell size={20} className="text-orange-500 dark:text-orange-400" />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <Bell size={20} className="text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-[280px] sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/20">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Notifications</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[480px] divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <BellOff size={24} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">We'll notify you when something arrives</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = iconMap[notif.type] || Bell;
                  const timeAgo = getTimeAgo(notif.created_at);

                  return (
                    <div
                      key={notif.id}
                      className={`group relative transition-all duration-200 ${
                        !notif.is_read 
                          ? 'bg-orange-50/40 dark:bg-orange-950/10' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="px-4 py-3 sm:px-5 sm:py-4">
                        <div className="flex gap-3">
                          {/* Icon with circle indicator for unread */}
                          <div className="relative flex-shrink-0">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${
                              !notif.is_read 
                                ? 'bg-orange-100 dark:bg-orange-900/30' 
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              <Icon size={14} className={`sm:text-base ${
                                !notif.is_read 
                                  ? 'text-orange-600 dark:text-orange-400' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`} />
                            </div>
                            {!notif.is_read && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                {notif.title}
                              </p>
                              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 flex items-center gap-0.5 sm:gap-1">
                                  <Clock size={10} />
                                  {timeAgo}
                                </span>
                                {!notif.is_read && (
                                  <button
                                    onClick={() => markAsRead(notif.id)}
                                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  >
                                    ✓
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            {notif.action_url && (
                              <Link
                                href={notif.action_url}
                                onClick={() => markAsRead(notif.id)}
                                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors group/link"
                              >
                                {notif.action_label || 'View Details'}
                                <span className="group-hover/link:translate-x-0.5 transition-transform">→</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 sm:px-5 sm:py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
