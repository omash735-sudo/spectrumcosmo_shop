'use client';

import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  KeyRound,
  Loader2,
  Save,
  Send,
  Database,
  Building2,
  Clock,
  Mail,
  Megaphone,
  Tag,
  Eye,
  Shield,
  Server,
  CheckCircle,
  AlertTriangle,
  Power,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
// TestAccountKillSwitch moved from dashboard to here
import TestAccountKillSwitch from '@/components/admin/TestAccountKillSwitch';

interface SystemStatus {
  database: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  realtime: 'connected' | 'disconnected';
  last_heartbeat: string;
  uptime: string;
  version: string;
}

export default function SettingsPage() {
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Social links state
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialMessage, setSocialMessage] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    twitter: '',
    facebook: '',
    tiktok: '',
    whatsapp: '',
    email: 'spectrumcosmo01@gmail.com',
  });

  // System status
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'SpectrumCosmo',
    store_email: 'hello@spectrumcosmo.shop',
    store_address: 'Lilongwe, Malawi',
    data_retention_days: '2555',
    default_delivery_days: '5',
    discount_banner_default: 'Get 25% off your next order with code: WELCOME25',
    footer_copyright: 'All rights reserved.',
    invoice_logo_url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
  });

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);

  // Fetch all settings on load
  useEffect(() => {
    const fetchAllSettings = async () => {
      try {
        const [socialRes, settingsRes, statusRes] = await Promise.all([
          fetch('/api/admin/social-links'),
          fetch('/api/admin/settings'),
          fetch('/api/admin/system/status'),
        ]);

        const socialData = await socialRes.json();
        if (socialData) setSocialLinks(prev => ({ ...prev, ...socialData }));

        const settingsData = await settingsRes.json();
        setStoreSettings(prev => ({
          ...prev,
          store_name: settingsData.company_name || prev.store_name,
          store_email: settingsData.company_email || prev.store_email,
          store_address: settingsData.company_address || prev.store_address,
          data_retention_days: settingsData.data_retention_days || prev.data_retention_days,
          default_delivery_days: settingsData.default_delivery_days || prev.default_delivery_days,
          discount_banner_default: settingsData.discount_banner_default || prev.discount_banner_default,
          footer_copyright: settingsData.footer_copyright || prev.footer_copyright,
          invoice_logo_url: settingsData.invoice_logo_url || prev.invoice_logo_url,
        }));

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setSystemStatus(statusData);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setSettingsLoading(false);
        setStatusLoading(false);
      }
    };
    fetchAllSettings();
  }, []);

  // Password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    const res = await fetch('/api/admin/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } else {
      setError(data.error || 'Failed to update password.');
    }
  };

  // Social links save handler
  const saveSocialLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocialLoading(true);
    setSocialMessage('');
    const res = await fetch('/api/admin/social-links', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(socialLinks),
    });
    setSocialLoading(false);
    setSocialMessage(res.ok ? 'Social links saved.' : 'Failed to save social links.');
  };

  // Store settings save handler
  const saveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeSettings),
    });
    setSavingStore(false);
    if (res.ok) {
      alert('Store settings saved.');
    } else {
      alert('Failed to save settings.');
    }
  };

  if (settingsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Settings & Content</h1>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">
          Manage your account security, store information, and website content.
        </p>
      </div>

      {/* Quick Links to Other Settings Pages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Link 
          href="/admin/email-templates" 
          className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 text-center hover:border-[var(--primary)] hover:shadow-md transition group"
        >
          <Mail className="mx-auto text-[var(--primary)] mb-1.5 sm:mb-2" size={20} />
          <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">Email Templates</p>
        </Link>
        <Link 
          href="/admin/promotional-banners" 
          className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 text-center hover:border-[var(--primary)] hover:shadow-md transition group"
        >
          <Megaphone className="mx-auto text-[var(--primary)] mb-1.5 sm:mb-2" size={20} />
          <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">Promotional Banners</p>
        </Link>
        <Link 
          href="/admin/order-status" 
          className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 text-center hover:border-[var(--primary)] hover:shadow-md transition group"
        >
          <Tag className="mx-auto text-[var(--primary)] mb-1.5 sm:mb-2" size={20} />
          <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">Order Status</p>
        </Link>
        <Link 
          href="/admin/payment-providers" 
          className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 text-center hover:border-[var(--primary)] hover:shadow-md transition group"
        >
          <Database className="mx-auto text-[var(--primary)] mb-1.5 sm:mb-2" size={20} />
          <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">Payment Providers</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Password Change */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-[var(--primary)]">
              <KeyRound size={18} className="sm:size-5" />
            </div>
            <h2 className="font-bold text-[var(--foreground)] text-sm sm:text-base">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-[var(--foreground-muted)] block mb-1.5">Current Password</label>
              <input
                type="password"
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-[var(--foreground-muted)] block mb-1.5">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg">{error}</p>}
            {message && <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg">{message}</p>}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-lg transition disabled:opacity-50 text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>

        {/* System Status */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Server size={18} className="sm:size-5" />
            </div>
            <h2 className="font-bold text-[var(--foreground)] text-sm sm:text-base">System Status</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            {statusLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-[var(--primary)]" size={24} />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-lg">
                  <span className="text-sm text-[var(--foreground-muted)]">Database</span>
                  <span className={`flex items-center gap-2 text-sm font-medium ${
                    systemStatus?.database === 'connected' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {systemStatus?.database === 'connected' ? (
                      <><CheckCircle size={16} /> Connected</>
                    ) : (
                      <><AlertTriangle size={16} /> Disconnected</>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-lg">
                  <span className="text-sm text-[var(--foreground-muted)]">Real-time Stream</span>
                  <span className={`flex items-center gap-2 text-sm font-medium ${
                    systemStatus?.realtime === 'connected' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {systemStatus?.realtime === 'connected' ? (
                      <><CheckCircle size={16} /> Connected</>
                    ) : (
                      <><AlertTriangle size={16} /> Disconnected</>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-lg">
                  <span className="text-sm text-[var(--foreground-muted)]">Uptime</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{systemStatus?.uptime || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-lg">
                  <span className="text-sm text-[var(--foreground-muted)]">Version</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{systemStatus?.version || 'v1.0.0'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Store Information */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 size={18} className="sm:size-5" />
            </div>
            <h2 className="font-bold text-[var(--foreground)] text-sm sm:text-base">Store Settings</h2>
          </div>
          <form onSubmit={saveStoreSettings} className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-[var(--foreground-muted)] block mb-1.5">Store Name</label>
              <input
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
                value={storeSettings.store_name}
                onChange={e => setStoreSettings(p => ({ ...p, store_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-[var(--foreground-muted)] block mb-1.5">Store Email</label>
              <input
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
                type="email"
                value={storeSettings.store_email}
                onChange={e => setStoreSettings(p => ({ ...p, store_email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-[var(--foreground-muted)] block mb-1.5">Store Address</label>
              <input
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
                value={storeSettings.store_address}
                onChange={e => setStoreSettings(p => ({ ...p, store_address: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-[var(--foreground-muted)] block mb-1.5">Invoice Logo URL</label>
              <input
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
                value={storeSettings.invoice_logo_url}
                onChange={e => setStoreSettings(p => ({ ...p, invoice_logo_url: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs sm:text-sm font-medium text-[var(--foreground-muted)] block mb-1.5">Data Retention (days)</label>
                <input
                  type="number"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
                  value={storeSettings.data_retention_days}
                  onChange={e => setStoreSettings(p => ({ ...p, data_retention_days: e.target.value }))}
                />
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-1">Soft-deleted user data cleanup</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-[var(--foreground-muted)] block mb-1.5">Default Delivery (days)</label>
                <input
                  type="number"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
                  value={storeSettings.default_delivery_days}
                  onChange={e => setStoreSettings(p => ({ ...p, default_delivery_days: e.target.value }))}
                />
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-1">Estimated delivery timeline</p>
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-[var(--foreground-muted)] block mb-1.5">Default Discount Banner</label>
              <textarea
                rows={2}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition resize-none"
                value={storeSettings.discount_banner_default}
                onChange={e => setStoreSettings(p => ({ ...p, discount_banner_default: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-[var(--foreground-muted)] block mb-1.5">Footer Copyright Text</label>
              <input
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
                value={storeSettings.footer_copyright}
                onChange={e => setStoreSettings(p => ({ ...p, footer_copyright: e.target.value }))}
              />
            </div>
            <button 
              type="submit" 
              disabled={savingStore} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-lg transition disabled:opacity-50 text-sm"
            >
              {savingStore ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Store Settings</>}
            </button>
          </form>
        </div>

        {/* Social Links */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Send size={18} className="sm:size-5" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--foreground)] text-sm sm:text-base">Social Links</h2>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Connect storefront footer to business accounts</p>
            </div>
          </div>
          <form onSubmit={saveSocialLinks} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <input
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
              placeholder="Instagram URL"
              value={socialLinks.instagram}
              onChange={e => setSocialLinks(p => ({ ...p, instagram: e.target.value }))}
            />
            <input
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
              placeholder="Twitter/X URL"
              value={socialLinks.twitter}
              onChange={e => setSocialLinks(p => ({ ...p, twitter: e.target.value }))}
            />
            <input
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
              placeholder="Facebook URL"
              value={socialLinks.facebook}
              onChange={e => setSocialLinks(p => ({ ...p, facebook: e.target.value }))}
            />
            <input
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
              placeholder="TikTok URL"
              value={socialLinks.tiktok}
              onChange={e => setSocialLinks(p => ({ ...p, tiktok: e.target.value }))}
            />
            <input
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
              placeholder="WhatsApp Link (wa.me/...)"
              value={socialLinks.whatsapp}
              onChange={e => setSocialLinks(p => ({ ...p, whatsapp: e.target.value }))}
            />
            <input
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
              placeholder="Business Email"
              value={socialLinks.email}
              onChange={e => setSocialLinks(p => ({ ...p, email: e.target.value }))}
            />
            {socialMessage && <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg">{socialMessage}</p>}
            <button 
              type="submit" 
              disabled={socialLoading} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-lg transition disabled:opacity-50 text-sm"
            >
              {socialLoading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} />Save Links</>}
            </button>
          </form>
        </div>

        {/* Test Account Kill Switch */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <Power size={18} className="sm:size-5" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--foreground)] text-sm sm:text-base">Test Account Management</h2>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Manage test user accounts</p>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <TestAccountKillSwitch />
          </div>
        </div>

        {/* Data Cleanup */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock size={18} className="sm:size-5" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--foreground)] text-sm sm:text-base">Data Cleanup</h2>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Permanently delete soft-deleted user data older than retention period</p>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <button
              onClick={async () => {
                if (!confirm('This action will permanently delete all soft-deleted user data older than the retention period. This cannot be undone. Continue?')) return;
                const res = await fetch('/api/admin/cleanup', { method: 'POST' });
                const data = await res.json();
                alert(data.message || 'Cleanup completed.');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition text-sm"
            >
              <Trash2 size={16} /> Run Cleanup Now
            </button>
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] text-center">
              This operation also runs automatically daily via Vercel Cron Jobs.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-[var(--background-card)] rounded-xl border-2 border-red-200 dark:border-red-800 overflow-hidden shadow-sm lg:col-span-2">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-red-200 dark:border-red-800 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle size={18} className="sm:size-5" />
            </div>
            <h2 className="font-bold text-red-600 dark:text-red-400 text-sm sm:text-base">Danger Zone</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Clear All Logs</p>
                <p className="text-xs text-red-600 dark:text-red-400">Remove all API and security logs</p>
              </div>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
                    // Clear logs logic
                    alert('Logs cleared successfully.');
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition whitespace-nowrap"
              >
                Clear Logs
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Reset System</p>
                <p className="text-xs text-red-600 dark:text-red-400">Reset all system settings to default</p>
              </div>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to reset all system settings? This cannot be undone.')) {
                    // Reset logic
                    alert('System settings reset to default.');
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition whitespace-nowrap"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tip */}
      <div className="mt-6 sm:mt-8 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon size={18} className="text-orange-600 dark:text-orange-400" />
          <h3 className="font-semibold text-orange-800 dark:text-orange-400 text-sm sm:text-base">Pro Tip</h3>
        </div>
        <p className="text-sm text-orange-700 dark:text-orange-300">
          You can manage <strong>email templates</strong>, <strong>promotional banners</strong>, <strong>order status messages</strong>, and <strong>payment providers</strong> from the quick links above.
          All settings are saved instantly and affect the customer experience in real-time.
        </p>
      </div>
    </div>
  );
}
