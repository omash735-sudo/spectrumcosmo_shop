'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Package, Truck, CreditCard } from 'lucide-react';
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
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
      <p className="text-gray-500 text-sm mb-6">Stay updated on your orders</p>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <BellOff size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = iconMap[notif.type] || Bell;
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-xl border p-4 hover:shadow-md transition ${
                  !notif.is_read ? 'border-l-4 border-l-orange-500 bg-orange-50/10' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Icon size={20} className="text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{notif.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                    {notif.action_url && (
                      <Link
                        href={notif.action_url}
                        onClick={() => markAsRead(notif.id)}
                        className="inline-block mt-3 text-sm text-orange-500 hover:underline"
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
          })}
        </div>
      )}
    </div>
  );
}
