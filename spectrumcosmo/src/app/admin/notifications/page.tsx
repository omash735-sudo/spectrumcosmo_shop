'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Bell, Send, Calendar, Save, Trash2, Eye, Users, 
  Loader2, Plus, Repeat, Search, RefreshCw, X, Clock
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
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'drafts' | 'scheduled' | 'sent'>('compose');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audienceType, setAudienceType] = useState<'all' | 'specific'>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [sendType, setSendType] = useState<'now' | 'schedule' | 'draft'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  
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
    setAudienceType('all');
    setSelectedCustomers([]);
    setSearchTerm('');
    setSendType('now');
    setScheduledDate('');
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
        const res = await fetch('/api/admin/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            body: message,
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
          throw new Error();
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
      case 'draft': return <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Draft</span>;
      case 'scheduled': return <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">Scheduled</span>;
      case 'sent': return <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400">Sent</span>;
      case 'cancelled': return <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400">Cancelled</span>;
      default: return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-orange-500" />
                Notification Manager
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                Send system messages, schedule announcements, and track read receipts
              </p>
            </div>
            <button
              onClick={() => fetchNotifications()}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Total Customers</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{stats.customers}</p>
              </div>
              <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-500 opacity-70" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Drafts</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.drafts}</p>
              </div>
              <Save className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-500 opacity-70" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Scheduled</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.scheduled}</p>
              </div>
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-500 opacity-70" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Sent</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{stats.sent}</p>
              </div>
              <Send className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-500 opacity-70" />
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
          {(['compose', 'drafts', 'scheduled', 'sent'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition capitalize ${
                activeTab === tab
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab === 'compose' && <Plus className="inline w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />}
              {tab === 'drafts' && <Save className="inline w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />}
              {tab === 'scheduled' && <Calendar className="inline w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />}
              {tab === 'sent' && <Send className="inline w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 md:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Compose New Message</h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., System Maintenance, New Stock Arrival..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter your message here..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audience</label>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <label className="flex items-center gap-1.5 sm:gap-2">
                    <input
                      type="radio"
                      checked={audienceType === 'all'}
                      onChange={() => setAudienceType('all')}
                      className="text-orange-500"
                    />
                    <span className="text-xs sm:text-sm">All Customers ({stats.customers})</span>
                  </label>
                  <label className="flex items-center gap-1.5 sm:gap-2">
                    <input
                      type="radio"
                      checked={audienceType === 'specific'}
                      onChange={() => setAudienceType('specific')}
                      className="text-orange-500"
                    />
                    <span className="text-xs sm:text-sm">Specific Customers</span>
                  </label>
                </div>
              </div>
              
              {audienceType === 'specific' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Customers ({selectedCustomers.length} selected)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search customers by name or email..."
                      className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="max-h-40 sm:max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredCustomers.slice(0, 50).map(customer => (
                      <label key={customer.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleCustomer(customer.id)}
                          className="text-orange-500 w-3.5 h-3.5 sm:w-4 sm:h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">{customer.name}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{customer.email}</p>
                        </div>
                      </label>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <p className="p-4 text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">No customers found</p>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Send Type</label>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <label className="flex items-center gap-1.5 sm:gap-2">
                    <input
                      type="radio"
                      checked={sendType === 'now'}
                      onChange={() => setSendType('now')}
                      className="text-orange-500"
                    />
                    <span className="text-xs sm:text-sm">Send Now</span>
                  </label>
                  <label className="flex items-center gap-1.5 sm:gap-2">
                    <input
                      type="radio"
                      checked={sendType === 'schedule'}
                      onChange={() => setSendType('schedule')}
                      className="text-orange-500"
                    />
                    <span className="text-xs sm:text-sm">Schedule for Later</span>
                  </label>
                  <label className="flex items-center gap-1.5 sm:gap-2">
                    <input
                      type="radio"
                      checked={sendType === 'draft'}
                      onChange={() => setSendType('draft')}
                      className="text-orange-500"
                    />
                    <span className="text-xs sm:text-sm">Save as Draft</span>
                  </label>
                </div>
              </div>
              
              {sendType === 'schedule' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full sm:w-64 px-3 sm:px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  onClick={resetForm}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Clear
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="px-4 sm:px-6 py-1.5 sm:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  {sendType === 'draft' ? 'Save Draft' : sendType === 'schedule' ? 'Schedule' : 'Send Now'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Drafts Tab */}
        {activeTab === 'drafts' && (
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <div className="flex justify-center py-8 sm:py-12"><Loader2 className="animate-spin text-orange-500" size={28} /></div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400 text-sm">No drafts saved</div>
            ) : (
              drafts.map(draft => (
                <div key={draft.id} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        {getStatusBadge(draft.status)}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{draft.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{draft.body}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mt-1.5 sm:mt-2">
                        Audience: {draft.audience_type === 'all' ? 'All Customers' : `${draft.specific_customer_ids?.length || 0} specific customers`}
                      </p>
                    </div>
                    <div className="flex gap-1 sm:gap-2 ml-2">
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Scheduled Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <div className="flex justify-center py-8 sm:py-12"><Loader2 className="animate-spin text-orange-500" size={28} /></div>
            ) : scheduled.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400 text-sm">No scheduled messages</div>
            ) : (
              scheduled.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        {getStatusBadge(item.status)}
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
                          Scheduled: {item.scheduled_for ? new Date(item.scheduled_for).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{item.body}</p>
                    </div>
                    <div className="flex gap-1 sm:gap-2 ml-2">
                      <button
                        onClick={() => handleCancelScheduled(item.id)}
                        className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Sent Tab */}
        {activeTab === 'sent' && (
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <div className="flex justify-center py-8 sm:py-12"><Loader2 className="animate-spin text-orange-500" size={28} /></div>
            ) : sent.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400 text-sm">No sent messages</div>
            ) : (
              sent.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        {getStatusBadge(item.status)}
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
                          Sent: {item.sent_at ? new Date(item.sent_at).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{item.body}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1.5 sm:mt-2">
                        <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">Read: {item.read_count}/{item.total_recipients}</span>
                        <span className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400">Unread: {item.unread_count}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 ml-2">
                      <button
                        onClick={() => handleViewReaders(item)}
                        className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                        title="View readers"
                      >
                        <Eye size={14} />
                      </button>
                      {item.unread_count > 0 && (
                        <button
                          onClick={() => handleResendToUnread(item)}
                          className="p-1.5 sm:p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition"
                          title="Resend to unread"
                        >
                          <Repeat size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Readers Modal */}
      {showReadersModal && selectedNotification && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Read Receipts: {selectedNotification.title}</h3>
              <button onClick={() => setShowReadersModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              {!readersData ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-orange-500" size={24} /></div>
              ) : (
                <>
                  {readersData.read.length > 0 && (
                    <div className="mb-5 sm:mb-6">
                      <h4 className="font-semibold text-green-600 dark:text-green-400 text-sm sm:text-base mb-2">✅ Read ({readersData.read.length})</h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {readersData.read.map((user: any) => (
                          <div key={user.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-green-50 dark:bg-green-950/20 rounded-lg gap-1 sm:gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm truncate">{user.name}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{user.read_at ? new Date(user.read_at).toLocaleString() : 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {readersData.unread.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 text-sm sm:text-base mb-2">⭕ Unread ({readersData.unread.length})</h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {readersData.unread.map((user: any) => (
                          <div key={user.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg gap-1 sm:gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm truncate">{user.name}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
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
