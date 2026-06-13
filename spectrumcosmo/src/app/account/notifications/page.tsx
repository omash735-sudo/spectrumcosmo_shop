'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Package, Truck, CreditCard, ArrowLeft, X, Trash2, Clock } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: number | string;
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
  admin: Bell,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

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

  const markAsRead = async (id: number | string) => {
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

  const clearAllNotifications = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const handleViewDetails = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.type === 'admin') {
      setModalTitle(notif.title);
      setModalMessage(notif.message);
      setModalOpen(true);
    } else if (notif.action_url) {
      window.location.href = notif.action_url;
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

  const getDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    if (date > weekAgo) return 'This Week';
    return 'Earlier';
  };

  // Group notifications
  const groupedNotifications = notifications.reduce((groups, notif) => {
    const group = getDateGroup(notif.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(notif);
    return groups;
  }, {} as Record<string, Notification[]>);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400 dark:text-gray-500 text-sm sm:text-base">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link 
            href="/account" 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
            aria-label="Back to account"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Notification Centre</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Stay updated on your orders</p>
          </div>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
            title="Clear all notifications"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BellOff size={28} className="text-gray-300 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">We'll notify you when something arrives</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupOrder.map(groupName => {
            const groupNotifs = groupedNotifications[groupName];
            if (!groupNotifs || groupNotifs.length === 0) return null;

            return (
              <div key={groupName}>
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-gray-400" />
                  <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {groupName}
                  </h2>
                </div>

                {/* Group Notifications */}
                <div className="space-y-2">
                  {groupNotifs.map((notif) => {
                    const Icon = iconMap[notif.type] || Bell;
                    const timeAgo = getTimeAgo(notif.created_at);

                    return (
                      <div
                        key={notif.id}
                        className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 hover:shadow-md transition-all duration-200 ${
                          !notif.is_read 
                            ? 'border-l-4 border-l-orange-500 bg-orange-50/5 dark:bg-orange-950/10' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              !notif.is_read 
                                ? 'bg-orange-100 dark:bg-orange-900/30' 
                                : 'bg-gray-100 dark:bg-gray-700'
                            }`}>
                              <Icon size={18} className={`${
                                !notif.is_read 
                                  ? 'text-orange-600 dark:text-orange-400' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className={`font-medium text-sm ${
                                !notif.is_read 
                                  ? 'text-gray-900 dark:text-white' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {notif.title}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {timeAgo}
                                </span>
                                {!notif.is_read && (
                                  <button
                                    onClick={() => markAsRead(notif.id)}
                                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    ✓
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                            <button
                              onClick={() => handleViewDetails(notif)}
                              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                            >
                              {notif.action_label || 'View Details'} →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for admin notifications */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{modalTitle}</h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {modalMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
