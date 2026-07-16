'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Bell, Send, Calendar, Save, Trash2, Eye, Users, 
  Loader2, Plus, Repeat, Search, RefreshCw, X, Clock, Edit,
  Wrench, ShoppingBag, Shirt, Package, Truck, CreditCard, Tag, Megaphone,
  Sparkles, AlertTriangle, Gift, Store, Users as UsersIcon, Shield, 
  CheckCircle, XCircle, HelpCircle, Star, Heart, Box, Bike, Plane,
  MapPin, Watch, Gem, Camera, Smartphone, Laptop, Coffee, Home, Dumbbell,
  Wallet, Banknote, Coins, Receipt, Percent, Rocket, Trophy, Settings,
  Database, Server, Cloud, Lock, Headphones, MessageCircle, Phone, Mail,
  BellRing, Info, Calendar as CalendarIcon,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  body: string;
  audience_type: 'all' | 'specific';
  specific_customer_ids: string[] | null;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  sent_by: string;
  sent_at: string | null;
  scheduled_for: string | null;
  created_at: string;
  total_recipients: number;
  read_count: number;
  unread_count: number;
  icon_name?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// Icon categories with pure Lucide icons
const iconCategories = [
  {
    name: 'Orders & Shipping',
    icons: [
      { value: 'package', label: 'Package', icon: Package },
      { value: 'box', label: 'Box', icon: Box },
      { value: 'truck', label: 'Truck', icon: Truck },
      { value: 'bike', label: 'Bike', icon: Bike },
      { value: 'plane', label: 'Plane', icon: Plane },
      { value: 'map-pin', label: 'Location', icon: MapPin },
      { value: 'clock', label: 'Clock', icon: Clock },
    ]
  },
  {
    name: 'Products & Inventory',
    icons: [
      { value: 'shopping-bag', label: 'Shopping Bag', icon: ShoppingBag },
      { value: 'shirt', label: 'Clothing', icon: Shirt },
      { value: 'watch', label: 'Watch', icon: Watch },
      { value: 'gem', label: 'Jewelry', icon: Gem },
      { value: 'camera', label: 'Camera', icon: Camera },
      { value: 'smartphone', label: 'Phone', icon: Smartphone },
      { value: 'laptop', label: 'Laptop', icon: Laptop },
      { value: 'coffee', label: 'Coffee', icon: Coffee },
      { value: 'home', label: 'Home', icon: Home },
      { value: 'dumbbell', label: 'Fitness', icon: Dumbbell },
    ]
  },
  {
    name: 'Payments & Finance',
    icons: [
      { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
      { value: 'wallet', label: 'Wallet', icon: Wallet },
      { value: 'banknote', label: 'Cash', icon: Banknote },
      { value: 'coins', label: 'Coins', icon: Coins },
      { value: 'receipt', label: 'Receipt', icon: Receipt },
      { value: 'percent', label: 'Discount', icon: Percent },
    ]
  },
  {
    name: 'Promotions & Marketing',
    icons: [
      { value: 'sparkles', label: 'New', icon: Sparkles },
      { value: 'gift', label: 'Gift', icon: Gift },
      { value: 'tag', label: 'Tag', icon: Tag },
      { value: 'megaphone', label: 'Announcement', icon: Megaphone },
      { value: 'rocket', label: 'Launch', icon: Rocket },
      { value: 'trophy', label: 'Achievement', icon: Trophy },
      { value: 'star', label: 'Star', icon: Star },
      { value: 'heart', label: 'Heart', icon: Heart },
    ]
  },
  {
    name: 'System & Maintenance',
    icons: [
      { value: 'wrench', label: 'Maintenance', icon: Wrench },
      { value: 'settings', label: 'Settings', icon: Settings },
      { value: 'database', label: 'Database', icon: Database },
      { value: 'server', label: 'Server', icon: Server },
      { value: 'cloud', label: 'Cloud', icon: Cloud },
      { value: 'shield', label: 'Security', icon: Shield },
      { value: 'lock', label: 'Lock', icon: Lock },
    ]
  },
  {
    name: 'Customer Support',
    icons: [
      { value: 'headphones', label: 'Support', icon: Headphones },
      { value: 'help-circle', label: 'Help', icon: HelpCircle },
      { value: 'message-circle', label: 'Message', icon: MessageCircle },
      { value: 'phone', label: 'Phone', icon: Phone },
      { value: 'mail', label: 'Mail', icon: Mail },
    ]
  },
  {
    name: 'Alerts & Updates',
    icons: [
      { value: 'bell', label: 'Bell', icon: Bell },
      { value: 'bell-ring', label: 'Alert', icon: BellRing },
      { value: 'info', label: 'Info', icon: Info },
      { value: 'alert-triangle', label: 'Warning', icon: AlertTriangle },
      { value: 'check-circle', label: 'Success', icon: CheckCircle },
      { value: 'x-circle', label: 'Error', icon: XCircle },
      { value: 'calendar', label: 'Calendar', icon: CalendarIcon },
    ]
  },
];

// ===== SKELETON =====
function NotificationsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-[var(--background-secondary)] rounded-xl" />
        ))}
      </div>
      <div className="flex gap-2 border-b pb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-[var(--background-secondary)] rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-[var(--background-card)] rounded-xl border border-[var(--border)]" />
    </div>
  );
}

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'drafts' | 'scheduled' | 'sent'>('compose');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('bell');
  const [audienceType, setAudienceType] = useState<'all' | 'specific'>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [sendType, setSendType] = useState<'now' | 'schedule' | 'draft'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [editingDraft, setEditingDraft] = useState<Notification | null>(null);
  
  // Lists
  const [drafts, setDrafts] = useState<Notification[]>([]);
  const [scheduled, setScheduled] = useState<Notification[]>([]);
  const [sent, setSent] = useState<Notification[]>([]);
  const [showReadersModal, setShowReadersModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [readersData, setReadersData] = useState<{ read: any[]; unread: any[] } | null>(null);
  
  // Stats
  const [stats, setStats] = useState({ customers: 0, drafts: 0, scheduled: 0, sent: 0 });
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/admin/customers');
        const data = await res.json();
        setCustomers(data);
        setStats(prev => ({ ...prev, customers: data.length }));
      } catch (err) {
        toast.error('Failed to load customers');
      }
    };
    fetchCustomers();
  }, []);
  
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'drafts') {
        const res = await fetch('/api/admin/notifications?status=draft');
        const data = await res.json();
        setDrafts(data.notifications);
        setStats(prev => ({ ...prev, drafts: data.notifications.length }));
      } else if (activeTab === 'scheduled') {
        const res = await fetch('/api/admin/notifications?status=scheduled');
        const data = await res.json();
        setScheduled(data.notifications);
        setStats(prev => ({ ...prev, scheduled: data.notifications.length }));
      } else if (activeTab === 'sent') {
        const res = await fetch('/api/admin/notifications?status=sent');
        const data = await res.json();
        setSent(data.notifications);
        setStats(prev => ({ ...prev, sent: data.notifications.length }));
      }
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (activeTab !== 'compose') {
      fetchNotifications();
    }
  }, [activeTab, fetchNotifications]);
  
  const resetForm = () => {
    setTitle('');
    setMessage('');
    setSelectedIcon('bell');
    setAudienceType('all');
    setSelectedCustomers([]);
    setSearchTerm('');
    setSendType('now');
    setScheduledDate('');
    setEditingDraft(null);
  };
  
  const editDraft = (draft: Notification) => {
    setTitle(draft.title);
    setMessage(draft.body);
    setSelectedIcon(draft.icon_name || 'bell');
    setAudienceType(draft.audience_type);
    setSelectedCustomers(draft.specific_customer_ids || []);
    setSendType('now');
    setActiveTab('compose');
    setEditingDraft(draft);
  };
  
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in title and message');
      return;
    }
    
    if (audienceType === 'specific' && selectedCustomers.length === 0) {
      toast.error('Please select at least one customer');
      return;
    }
    
    setLoading(true);
    
    try {
      if (sendType === 'draft') {
        const res = await fetch('/api/admin/notifications/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            body: message,
            icon_name: selectedIcon,
            audience_type: audienceType,
            specific_customer_ids: selectedCustomers,
          }),
        });
        
        if (res.ok) {
          toast.success('Draft saved successfully');
          resetForm();
          if (activeTab === 'drafts') fetchNotifications();
        } else {
          throw new Error();
        }
      } else if (sendType === 'schedule') {
        if (!scheduledDate) {
          toast.error('Please select a schedule date and time');
          return;
        }
        
        const res = await fetch('/api/admin/notifications/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            body: message,
            icon_name: selectedIcon,
            audience_type: audienceType,
            specific_customer_ids: selectedCustomers,
            scheduled_for: scheduledDate,
          }),
        });
        
        if (res.ok) {
          toast.success('Message scheduled successfully');
          resetForm();
          if (activeTab === 'scheduled') fetchNotifications();
        } else {
          throw new Error();
        }
      } else {
        if (editingDraft) {
          await fetch(`/api/admin/notifications/drafts?id=${editingDraft.id}`, { method: 'DELETE' });
          setEditingDraft(null);
        }
        
        const res = await fetch('/api/admin/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            body: message,
            icon_name: selectedIcon,
            audience_type: audienceType,
            specific_customer_ids: selectedCustomers,
          }),
        });
        
        const data = await res.json();
        if (res.ok) {
          toast.success(`Message sent to ${data.recipients} customers`);
          resetForm();
          if (activeTab === 'sent') fetchNotifications();
        } else {
          throw new Error(data.error || 'Send failed');
        }
      }
    } catch (err) {
      toast.error('Failed to process message');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendToUnread = async (notification: Notification) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications/${notification.id}/resend`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Reminder sent to ${data.recipients} unread customers`);
        fetchNotifications();
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error('Failed to resend');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelScheduled = async (id: string) => {
    if (!confirm('Cancel this scheduled message?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications/${id}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        toast.success('Scheduled message cancelled');
        fetchNotifications();
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error('Failed to cancel');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteDraft = async (id: string) => {
    if (!confirm('Delete this draft?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications/drafts?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Draft deleted');
        fetchNotifications();
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewReaders = async (notification: Notification) => {
    setSelectedNotification(notification);
    setShowReadersModal(true);
    setReadersData(null);
    
    try {
      const res = await fetch(`/api/admin/notifications/${notification.id}/readers`);
      const data = await res.json();
      setReadersData(data);
    } catch (err) {
      toast.error('Failed to load readers data');
    }
  };
  
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const toggleCustomer = (id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft': 
        return <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Draft</span>;
      case 'scheduled': 
        return <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">Scheduled</span>;
      case 'sent': 
        return <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400">Sent</span>;
      case 'cancelled': 
        return <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400">Cancelled</span>;
      default: return null;
    }
  };
  
  const getIconComponent = (iconName: string) => {
    for (const category of iconCategories) {
      const found = category.icons.find(i => i.value === iconName);
      if (found) return found.icon;
    }
    return Bell;
  };
  
  const SelectedIconPreview = getIconComponent(selectedIcon);
  
  if (loading && activeTab !== 'compose') {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Notification Manager</h1>
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
                  Send system messages, schedule announcements, and track read receipts
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchNotifications()}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--background-secondary)] transition min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Refresh"
            >
              <RefreshCw size={16} className={`text-[var(--foreground-muted)] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Customers</p>
                <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{stats.customers}</p>
              </div>
              <UsersIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--primary)] opacity-70" />
            </div>
          </div>
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Drafts</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.drafts}</p>
              </div>
              <Save className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-500 opacity-70" />
            </div>
          </div>
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Scheduled</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">{stats.scheduled}</p>
              </div>
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500 opacity-70" />
            </div>
          </div>
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Sent</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.sent}</p>
              </div>
              <Send className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500 opacity-70" />
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 border-b border-[var(--border)] pb-2">
          {(['compose', 'drafts', 'scheduled', 'sent'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition capitalize min-h-[36px] sm:min-h-[40px] ${
                activeTab === tab
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]'
              }`}
            >
              {tab === 'compose' && <Plus className="inline w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />}
              {tab === 'drafts' && <Save className="inline w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />}
              {tab === 'scheduled' && <Calendar className="inline w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />}
              {tab === 'sent' && <Send className="inline w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />}
              <span className="hidden xs:inline">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              <span className="xs:hidden">{tab.charAt(0).toUpperCase()}</span>
            </button>
          ))}
        </div>
        
        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-4">
              {editingDraft ? `Edit Draft: ${editingDraft.title}` : 'Compose New Message'}
            </h2>
            
            <div className="space-y-4">
              {/* Icon Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">
                  Message Icon
                </label>
                <div className="border border-[var(--border)] rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--border)]">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                      <SelectedIconPreview size={20} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">Selected Icon Preview</p>
                      <p className="text-xs text-[var(--foreground-muted)]">This icon will appear next to the notification</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {iconCategories.map((category) => (
                      <div key={category.name}>
                        <h4 className="text-[10px] sm:text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
                          {category.name}
                        </h4>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 sm:gap-2">
                          {category.icons.map((icon) => {
                            const IconComponent = icon.icon;
                            const isSelected = selectedIcon === icon.value;
                            return (
                              <button
                                key={icon.value}
                                type="button"
                                onClick={() => setSelectedIcon(icon.value)}
                                className={`flex flex-col items-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 rounded-lg transition-all min-h-[48px] min-w-[40px] ${
                                  isSelected
                                    ? 'bg-orange-100 dark:bg-orange-900/30 ring-2 ring-[var(--primary)]'
                                    : 'hover:bg-[var(--background-secondary)]'
                                }`}
                                title={icon.label}
                              >
                                <IconComponent size={16} className={isSelected ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'} />
                                <span className="text-[8px] sm:text-[9px] text-[var(--foreground-muted)] leading-tight">{icon.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., System Maintenance, New Stock Arrival..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter your message here..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-[10px] text-[var(--foreground-muted)]">
                    {message.length} characters
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">Audience</label>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={audienceType === 'all'}
                      onChange={() => setAudienceType('all')}
                      className="text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-xs sm:text-sm">All Customers ({stats.customers})</span>
                  </label>
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={audienceType === 'specific'}
                      onChange={() => setAudienceType('specific')}
                      className="text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-xs sm:text-sm">Specific Customers</span>
                  </label>
                </div>
              </div>
              
              {audienceType === 'specific' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">
                    Select Customers ({selectedCustomers.length} selected)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" size={14} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search customers by name or email..."
                      className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition mb-2 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                    />
                  </div>
                  <div className="max-h-40 sm:max-h-48 overflow-y-auto border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
                    {filteredCustomers.slice(0, 50).map(customer => (
                      <label key={customer.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-[var(--background-secondary)] cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleCustomer(customer.id)}
                          className="text-[var(--primary)] w-3.5 h-3.5 sm:w-4 sm:h-4 focus:ring-[var(--primary)]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm text-[var(--foreground)] truncate">{customer.name}</p>
                          <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] truncate">{customer.email}</p>
                        </div>
                      </label>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <p className="p-4 text-center text-[var(--foreground-muted)] text-xs sm:text-sm">No customers found</p>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">Send Type</label>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={sendType === 'now'}
                      onChange={() => setSendType('now')}
                      className="text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-xs sm:text-sm">Send Now</span>
                  </label>
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={sendType === 'schedule'}
                      onChange={() => setSendType('schedule')}
                      className="text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-xs sm:text-sm">Schedule for Later</span>
                  </label>
                  <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={sendType === 'draft'}
                      onChange={() => setSendType('draft')}
                      className="text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-xs sm:text-sm">Save as Draft</span>
                  </label>
                </div>
              </div>
              
              {sendType === 'schedule' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full sm:w-64 px-3 sm:px-4 py-2 text-sm bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                  />
                </div>
              )}
              
              <div className="flex flex-wrap justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-[var(--border)]">
                <button
                  onClick={resetForm}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[36px] sm:min-h-[40px]"
                >
                  Clear
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="px-4 sm:px-6 py-1.5 sm:py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  {editingDraft ? 'Send Edited Draft' : (sendType === 'draft' ? 'Save Draft' : sendType === 'schedule' ? 'Schedule' : 'Send Now')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Drafts Tab */}
        {activeTab === 'drafts' && (
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <div className="flex justify-center py-8 sm:py-12">
                <Loader2 className="animate-spin text-[var(--primary)]" size={28} />
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-[var(--foreground-muted)] text-sm">
                <Save className="w-12 h-12 mx-auto mb-3 opacity-30" />
                No drafts saved
              </div>
            ) : (
              drafts.map(draft => {
                const DraftIcon = getIconComponent(draft.icon_name || 'bell');
                return (
                  <div key={draft.id} className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                          {getStatusBadge(draft.status)}
                          <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                            Created: {new Date(draft.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                            <DraftIcon size={12} className="text-[var(--primary)]" />
                          </div>
                          <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate">{draft.title}</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">{draft.body}</p>
                        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-1.5 opacity-70">
                          Audience: {draft.audience_type === 'all' ? 'All Customers' : `${draft.specific_customer_ids?.length || 0} specific customers`}
                        </p>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => editDraft(draft)}
                          className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Edit and send"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Delete draft"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        
        {/* Scheduled Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <div className="flex justify-center py-8 sm:py-12">
                <Loader2 className="animate-spin text-[var(--primary)]" size={28} />
              </div>
            ) : scheduled.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-[var(--foreground-muted)] text-sm">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                No scheduled messages
              </div>
            ) : (
              scheduled.map(item => {
                const ScheduledIcon = getIconComponent(item.icon_name || 'bell');
                return (
                  <div key={item.id} className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                          {getStatusBadge(item.status)}
                          <Clock size={12} className="text-[var(--foreground-muted)]" />
                          <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                            Scheduled: {item.scheduled_for ? new Date(item.scheduled_for).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                            <ScheduledIcon size={12} className="text-[var(--primary)]" />
                          </div>
                          <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate">{item.title}</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">{item.body}</p>
                      </div>
                      <button
                        onClick={() => handleCancelScheduled(item.id)}
                        className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition min-h-[32px] flex-shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        
        {/* Sent Tab */}
        {activeTab === 'sent' && (
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <div className="flex justify-center py-8 sm:py-12">
                <Loader2 className="animate-spin text-[var(--primary)]" size={28} />
              </div>
            ) : sent.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-[var(--foreground-muted)] text-sm">
                <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
                No sent messages
              </div>
            ) : (
              sent.map(item => {
                const SentIcon = getIconComponent(item.icon_name || 'bell');
                return (
                  <div key={item.id} className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                          {getStatusBadge(item.status)}
                          <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                            Sent: {item.sent_at ? new Date(item.sent_at).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                            <SentIcon size={12} className="text-[var(--primary)]" />
                          </div>
                          <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate">{item.title}</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">{item.body}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1.5">
                          <span className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">Read: {item.read_count}/{item.total_recipients}</span>
                          <span className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400">Unread: {item.unread_count}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleViewReaders(item)}
                          className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="View readers"
                        >
                          <Eye size={14} />
                        </button>
                        {item.unread_count > 0 && (
                          <button
                            onClick={() => handleResendToUnread(item)}
                            className="p-1.5 sm:p-2 text-[var(--primary)] hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Resend to unread"
                          >
                            <Repeat size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      
      {/* Readers Modal */}
      {showReadersModal && selectedNotification && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--background-card)] rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[var(--border)]">
              <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] truncate">
                Read Receipts: {selectedNotification.title}
              </h3>
              <button 
                onClick={() => setShowReadersModal(false)} 
                className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X size={18} className="text-[var(--foreground-muted)]" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(85vh-70px)]">
              {!readersData ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-[var(--primary)]" size={24} />
                </div>
              ) : (
                <>
                  {readersData.read.length > 0 && (
                    <div className="mb-5 sm:mb-6">
                      <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base mb-2">
                        ✅ Read ({readersData.read.length})
                      </h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {readersData.read.map((user: any) => (
                          <div key={user.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg gap-1 sm:gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--foreground)] text-xs sm:text-sm truncate">{user.name}</p>
                              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] truncate">{user.email}</p>
                            </div>
                            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] flex-shrink-0">
                              {user.read_at ? new Date(user.read_at).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {readersData.unread.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 text-sm sm:text-base mb-2">
                        ⭕ Unread ({readersData.unread.length})
                      </h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {readersData.unread.map((user: any) => (
                          <div key={user.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg gap-1 sm:gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--foreground)] text-xs sm:text-sm truncate">{user.name}</p>
                              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] truncate">{user.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
