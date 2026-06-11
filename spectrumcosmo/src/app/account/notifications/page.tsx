'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Package, Truck, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=50');
      const data = await res.json();
      setNotifications(data.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400 dark:text-gray-500 text-sm sm:text-base">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-0">
      {/* Header with Back Button */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Link 
          href="/account" 
          className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          aria-label="Back to account"
        >
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400 sm:w-5 sm:h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Stay updated on your orders</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 p-8 sm:p-12 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <BellOff size={28} className="text-gray-300 dark:text-gray-500 sm:w-8 sm:h-8" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">No notifications yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mt-1">We'll notify you when something arrives</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {notifications.map((notif) => {
            const Icon = iconMap[notif.type] || Bell;
            return (
              <div
                key={notif.id}
                className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 hover:shadow-md transition ${
                  !notif.is_read 
                    ? 'border-l-4 border-l-orange-500 bg-orange-50/10 dark:bg-orange-950/20' 
                    : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="flex gap-2.5 sm:gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-950/30 rounded-full flex items-center justify-center">
                      <Icon size={16} className="text-orange-500 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className={`font-medium text-sm sm:text-base ${
                        !notif.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 whitespace-nowrap"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">
                      {notif.message}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1.5 sm:mt-2">
                      {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {notif.action_url && (
                      <Link
                        href={notif.action_url}
                        onClick={() => markAsRead(notif.id)}
                        className="inline-block mt-2 sm:mt-3 text-xs sm:text-sm text-orange-500 hover:text-orange-600 font-medium"
                      >
                        {notif.action_label || 'View Details'} →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unread count indicator */}
      {notifications.filter(n => !n.is_read).length > 0 && (
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
            You have {notifications.filter(n => !n.is_read).length} unread {notifications.filter(n => !n.is_read).length === 1 ? 'notification' : 'notifications'}
          </p>
        </div>
      )}
    </div>
  );
}
