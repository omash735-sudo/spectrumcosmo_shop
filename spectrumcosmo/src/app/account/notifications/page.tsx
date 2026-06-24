'use client';

import { useEffect, useState } from 'react';
import { 
  Bell, BellOff, Package, Truck, CreditCard, ArrowLeft, X, Trash2, Clock,
  Box, Bike, Plane, MapPin, ShoppingBag, Shirt, Watch, Gem, Camera, 
  Smartphone, Laptop, Coffee, Home, Dumbbell, Wallet, Banknote, Coins, 
  Receipt, Percent, Sparkles, Gift, Tag, Megaphone, Rocket, Trophy, 
  Star, Heart, Wrench, Settings, Database, Server, Cloud, Shield, Lock,
  Headphones, HelpCircle, MessageCircle, Phone, Mail, BellRing, Info, 
  AlertTriangle, CheckCircle, XCircle, Calendar, MoreVertical
} from 'lucide-react';
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
  icon_name?: string;
}

const getIconComponent = (iconName?: string) => {
  if (!iconName) return Bell;
  
  const iconMap: Record<string, any> = {
    'package': Package,
    'box': Box,
    'truck': Truck,
    'bike': Bike,
    'plane': Plane,
    'map-pin': MapPin,
    'clock': Clock,
    'shopping-bag': ShoppingBag,
    'shirt': Shirt,
    'watch': Watch,
    'gem': Gem,
    'camera': Camera,
    'smartphone': Smartphone,
    'laptop': Laptop,
    'coffee': Coffee,
    'home': Home,
    'dumbbell': Dumbbell,
    'credit-card': CreditCard,
    'wallet': Wallet,
    'banknote': Banknote,
    'coins': Coins,
    'receipt': Receipt,
    'percent': Percent,
    'sparkles': Sparkles,
    'gift': Gift,
    'tag': Tag,
    'megaphone': Megaphone,
    'rocket': Rocket,
    'trophy': Trophy,
    'star': Star,
    'heart': Heart,
    'wrench': Wrench,
    'settings': Settings,
    'database': Database,
    'server': Server,
    'cloud': Cloud,
    'shield': Shield,
    'lock': Lock,
    'headphones': Headphones,
    'help-circle': HelpCircle,
    'message-circle': MessageCircle,
    'phone': Phone,
    'mail': Mail,
    'bell': Bell,
    'bell-ring': BellRing,
    'info': Info,
    'alert-triangle': AlertTriangle,
    'check-circle': CheckCircle,
    'x-circle': XCircle,
    'calendar': Calendar,
  };
  
  return iconMap[iconName] || Bell;
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

  const groupedNotifications = notifications.reduce((groups, notif) => {
    const group = getDateGroup(notif.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(notif);
    return groups;
  }, {} as Record<string, Notification[]>);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];

  // Separate unread notifications for "New" section
  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm dark:shadow-gray-900/30">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <BellOff size={28} className="text-gray-300 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">We'll notify you when something arrives</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* New Section - Unread notifications */}
          {unreadNotifications.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">New</span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="space-y-3">
                {unreadNotifications.map((notif) => {
                  const Icon = getIconComponent(notif.icon_name);
                  const timeAgo = getTimeAgo(notif.created_at);

                  return (
                    <div
                      key={notif.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-gray-900/30 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow duration-200"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                            <Icon size={18} className="text-blue-500 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {notif.title}
                            </p>
                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                              {timeAgo}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => handleViewDetails(notif)}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                              {notif.action_label || 'View Details'}
                            </button>
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              Mark as read
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grouped notifications */}
          {groupOrder.map(groupName => {
            const groupNotifs = groupedNotifications[groupName];
            if (!groupNotifs || groupNotifs.length === 0) return null;
            
            // Filter out unread notifications (already shown in "New" section)
            const readNotifs = groupNotifs.filter(n => n.is_read);
            if (readNotifs.length === 0) return null;

            return (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {groupName}
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="space-y-3">
                  {readNotifs.map((notif) => {
                    const Icon = getIconComponent(notif.icon_name);
                    const timeAgo = getTimeAgo(notif.created_at);

                    return (
                      <div
                        key={notif.id}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-gray-900/30 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow duration-200"
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                              <Icon size={18} className="text-gray-400 dark:text-gray-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                {notif.title}
                              </p>
                              <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                {timeAgo}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                            <button
                              onClick={() => handleViewDetails(notif)}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-2"
                            >
                              {notif.action_label || 'View Details'}
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl dark:shadow-gray-900/50">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{modalTitle}</h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {modalMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
