'use client';

import { useEffect, useState } from 'react';
import { 
  Bell, BellOff, Package, Truck, CreditCard, ArrowLeft, X, Trash2, Clock,
  Box, Bike, Plane, MapPin, ShoppingBag, Shirt, Watch, Gem, Camera, 
  Smartphone, Laptop, Coffee, Home, Dumbbell, Wallet, Banknote, Coins, 
  Receipt, Percent, Sparkles, Gift, Tag, Megaphone, Rocket, Trophy, 
  Star, Heart, Wrench, Settings, Database, Server, Cloud, Shield, Lock,
  Headphones, HelpCircle, MessageCircle, Phone, Mail, BellRing, Info, 
  AlertTriangle, CheckCircle, XCircle, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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

  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-[var(--foreground-muted)] text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 bg-[var(--background)] min-h-screen">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-[var(--background-secondary)] rounded-xl transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} className="text-[var(--foreground-muted)]" />
        </button>
        <div className="flex-1 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Notifications</h1>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {notifications.length === 0 ? (
        <div className="bg-[var(--background-card)] rounded-2xl p-12 text-center shadow-sm border border-[var(--border)]">
          <div className="w-16 h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
            <BellOff size={28} className="text-[var(--foreground-muted)]/50" />
          </div>
          <p className="text-[var(--foreground-muted)]">No notifications yet</p>
          <p className="text-[var(--foreground-muted)]/60 text-sm mt-1">We'll notify you when something arrives</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">New</span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>
              <div className="space-y-3">
                {unreadNotifications.map((notif) => {
                  const Icon = getIconComponent(notif.icon_name);
                  const timeAgo = getTimeAgo(notif.created_at);

                  return (
                    <div
                      key={notif.id}
                      className="bg-[var(--background-card)] rounded-2xl p-4 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                            <Icon size={18} className="text-[var(--primary)]" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm text-[var(--foreground)]">
                              {notif.title}
                            </p>
                            <span className="text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                              {timeAgo}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--foreground-muted)] mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => handleViewDetails(notif)}
                              className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                            >
                              {notif.action_label || 'View Details'}
                            </button>
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
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

          {/* Read Notifications Grouped by Date */}
          {groupOrder.map(groupName => {
            const groupNotifs = groupedNotifications[groupName];
            if (!groupNotifs || groupNotifs.length === 0) return null;
            
            const readNotifs = groupNotifs.filter(n => n.is_read);
            if (readNotifs.length === 0) return null;

            return (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                    {groupName}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>
                <div className="space-y-3">
                  {readNotifs.map((notif) => {
                    const Icon = getIconComponent(notif.icon_name);
                    const timeAgo = getTimeAgo(notif.created_at);

                    return (
                      <div
                        key={notif.id}
                        className="bg-[var(--background-card)] rounded-2xl p-4 shadow-sm border border-[var(--border)] hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-[var(--background-secondary)] flex items-center justify-center">
                              <Icon size={18} className="text-[var(--foreground-muted)]" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm text-[var(--foreground)]/70">
                                {notif.title}
                              </p>
                              <span className="text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                                {timeAgo}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--foreground-muted)] mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                            <button
                              onClick={() => handleViewDetails(notif)}
                              className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors mt-2"
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

      {/* Admin Notification Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--background-card)] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[var(--border)]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{modalTitle}</h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-1 hover:bg-[var(--background-secondary)] rounded-lg transition"
              >
                <X size={18} className="text-[var(--foreground-muted)]" />
              </button>
            </div>
            <p className="text-[var(--foreground-muted)] whitespace-pre-wrap leading-relaxed">
              {modalMessage}
            </p>
          </div>
        </div>
      )}
      
    </div>
  );
}
