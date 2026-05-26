'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, BellOff, CheckCircle, XCircle, Package, Truck, CreditCard } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        {unreadCount > 0 ? (
          <>
            <Bell size={20} className="text-orange-500" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <Bell size={20} className="text-gray-500" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border z-50 max-h-[500px] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-orange-500 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellOff size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = iconMap[notif.type] || Bell;
                  const isDeliveryConfirm = notif.type === 'delivery_confirmation';

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 border-b hover:bg-gray-50 transition ${
                        !notif.is_read ? 'bg-orange-50/30' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <Icon size={18} className="text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </p>

                          {notif.action_url && (
                            <Link
                              href={notif.action_url}
                              onClick={() => markAsRead(notif.id)}
                              className="inline-block mt-2 text-xs text-orange-500 hover:underline"
                            >
                              {notif.action_label || 'View Details'} →
                            </Link>
                          )}
                        </div>
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
