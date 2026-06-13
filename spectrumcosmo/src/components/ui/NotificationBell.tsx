'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Bell, BellOff, Sparkles, BarChart3, Wrench, ChevronRight, Trash2,
  // Import all icons for dynamic loading
  Package, Box, Truck, Bike, Plane, MapPin, Clock,
  ShoppingBag, Shirt, Watch, Gem, Camera, Smartphone, Laptop, Coffee, Home, Dumbbell,
  CreditCard, Wallet, Banknote, Coins, Receipt, Percent,
  Gift, Tag, Megaphone, Rocket, Trophy, Star, Heart,
  Settings, Database, Server, Cloud, Shield, Lock,
  Headphones, HelpCircle, MessageCircle, Phone, Mail,
  BellRing, Info, AlertTriangle, CheckCircle, XCircle, Calendar
} from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  action_url: string;
  action_label: string;
  is_read: boolean;
  created_at: string;
  icon_name?: string; // Add icon_name field
}

// Dynamic icon mapper - matches admin panel icons
const getIconComponent = (iconName?: string) => {
  if (!iconName) return Sparkles;
  
  const iconMap: Record<string, any> = {
    // Orders & Shipping
    'package': Package,
    'box': Box,
    'truck': Truck,
    'bike': Bike,
    'plane': Plane,
    'map-pin': MapPin,
    'clock': Clock,
    // Products & Inventory
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
    // Payments & Finance
    'credit-card': CreditCard,
    'wallet': Wallet,
    'banknote': Banknote,
    'coins': Coins,
    'receipt': Receipt,
    'percent': Percent,
    // Promotions & Marketing
    'sparkles': Sparkles,
    'gift': Gift,
    'tag': Tag,
    'megaphone': Megaphone,
    'rocket': Rocket,
    'trophy': Trophy,
    'star': Star,
    'heart': Heart,
    // System & Maintenance
    'wrench': Wrench,
    'settings': Settings,
    'database': Database,
    'server': Server,
    'cloud': Cloud,
    'shield': Shield,
    'lock': Lock,
    // Customer Support
    'headphones': Headphones,
    'help-circle': HelpCircle,
    'message-circle': MessageCircle,
    'phone': Phone,
    'mail': Mail,
    // Alerts & Updates
    'bell': Bell,
    'bell-ring': BellRing,
    'info': Info,
    'alert-triangle': AlertTriangle,
    'check-circle': CheckCircle,
    'x-circle': XCircle,
    'calendar': Calendar,
  };
  
  return iconMap[iconName] || Sparkles;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20');
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

  const clearAllNotifications = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  // Group notifications by date
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

  // Group notifications
  const groupedNotifications = notifications.reduce((groups, notif) => {
    const group = getDateGroup(notif.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(notif);
    return groups;
  }, {} as Record<string, Notification[]>);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];

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
          <div className="absolute right-0 mt-3 w-[320px] sm:w-[420px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
            
            {/* Header with Trash Icon */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notification Centre</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                  title="Clear all notifications"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Notifications List with Groups */}
            <div className="overflow-y-auto max-h-[550px]">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <BellOff size={24} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">We'll notify you when something arrives</p>
                </div>
              ) : (
                groupOrder.map(groupName => {
                  const groupNotifs = groupedNotifications[groupName];
                  if (!groupNotifs || groupNotifs.length === 0) return null;

                  return (
                    <div key={groupName}>
                      {/* Group Header */}
                      <div className="px-5 pt-4 pb-2 bg-gray-50/50 dark:bg-gray-800/30">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {groupName}
                        </h4>
                      </div>

                      {/* Group Notifications */}
                      {groupNotifs.map((notif) => {
                        // Use dynamic icon from admin, fallback to Sparkles
                        const Icon = getIconComponent(notif.icon_name);
                        const timeAgo = getTimeAgo(notif.created_at);

                        return (
                          <div
                            key={notif.id}
                            className={`group px-5 py-4 transition-all duration-200 border-b border-gray-50 dark:border-gray-800 ${
                              !notif.is_read 
                                ? 'bg-orange-50/20 dark:bg-orange-950/5' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                            }`}
                          >
                            <div className="flex gap-3">
                              {/* Icon */}
                              <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  !notif.is_read 
                                    ? 'bg-orange-100 dark:bg-orange-900/30' 
                                    : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                  <Icon size={18} className={`${
                                    !notif.is_read 
                                      ? 'text-orange-600 dark:text-orange-400' 
                                      : 'text-gray-500 dark:text-gray-400'
                                  }`} />
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                    {notif.title}
                                  </p>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                                    {timeAgo}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                  {notif.message}
                                </p>
                                {notif.action_url && (
                                  <Link
                                    href={notif.action_url}
                                    onClick={() => markAsRead(notif.id)}
                                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                                  >
                                    {notif.action_label || 'Learn More'}
                                    <ChevronRight size={12} />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
