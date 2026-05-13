'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Loader2, Save, Send, Database, Building2, Clock, Mail, Megaphone, Tag, Settings as SettingsIcon, Eye } from 'lucide-react';
import Link from 'next/link';

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
        const [socialRes, settingsRes] = await Promise.all([
          fetch('/api/admin/social-links'),
          fetch('/api/admin/settings'),
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
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setSettingsLoading(false);
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
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings & Content</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account security, store information, email templates, and website content.</p>
      </div>

      {/* Quick Links to Other Settings Pages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/email-templates" className="bg-white rounded-2xl border p-4 text-center hover:border-orange-200 transition">
          <Mail className="mx-auto text-orange-500 mb-2" size={24} />
          <p className="text-sm font-medium">Email Templates</p>
        </Link>
        <Link href="/admin/promotional-banners" className="bg-white rounded-2xl border p-4 text-center hover:border-orange-200 transition">
          <Megaphone className="mx-auto text-orange-500 mb-2" size={24} />
          <p className="text-sm font-medium">Promotional Banners</p>
        </Link>
        <Link href="/admin/order-status" className="bg-white rounded-2xl border p-4 text-center hover:border-orange-200 transition">
          <Tag className="mx-auto text-orange-500 mb-2" size={24} />
          <p className="text-sm font-medium">Order Status</p>
        </Link>
        <Link href="/admin/payment-providers" className="bg-white rounded-2xl border p-4 text-center hover:border-orange-200 transition">
          <Database className="mx-auto text-orange-500 mb-2" size={24} />
          <p className="text-sm font-medium">Payment Providers</p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Password Change */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <KeyRound size={20} />
            </div>
            <h2 className="font-bold text-gray-800">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                required
                className="input"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
            {message && <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl">{message}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Store Information & Data Retention */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Building2 size={20} />
            </div>
            <h2 className="font-bold text-gray-800">Store Settings</h2>
          </div>
          <form onSubmit={saveStoreSettings} className="p-6 space-y-4">
            <div>
              <label>Store Name</label>
              <input
                className="input"
                value={storeSettings.store_name}
                onChange={e => setStoreSettings(p => ({ ...p, store_name: e.target.value }))}
              />
            </div>
            <div>
              <label>Store Email</label>
              <input
                className="input"
                type="email"
                value={storeSettings.store_email}
                onChange={e => setStoreSettings(p => ({ ...p, store_email: e.target.value }))}
              />
            </div>
            <div>
              <label>Store Address</label>
              <input
                className="input"
                value={storeSettings.store_address}
                onChange={e => setStoreSettings(p => ({ ...p, store_address: e.target.value }))}
              />
            </div>
            <div>
              <label>Invoice Logo URL</label>
              <input
                className="input"
                value={storeSettings.invoice_logo_url}
                onChange={e => setStoreSettings(p => ({ ...p, invoice_logo_url: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label>Data Retention (days)</label>
                <input
                  type="number"
                  className="input"
                  value={storeSettings.data_retention_days}
                  onChange={e => setStoreSettings(p => ({ ...p, data_retention_days: e.target.value }))}
                />
                <p className="text-xs text-gray-500">Soft-deleted user data cleanup</p>
              </div>
              <div>
                <label>Default Delivery (days)</label>
                <input
                  type="number"
                  className="input"
                  value={storeSettings.default_delivery_days}
                  onChange={e => setStoreSettings(p => ({ ...p, default_delivery_days: e.target.value }))}
                />
                <p className="text-xs text-gray-500">Estimated delivery timeline</p>
              </div>
            </div>
            <div>
              <label>Default Discount Banner</label>
              <textarea
                rows={2}
                className="input"
                value={storeSettings.discount_banner_default}
                onChange={e => setStoreSettings(p => ({ ...p, discount_banner_default: e.target.value }))}
              />
            </div>
            <div>
              <label>Footer Copyright Text</label>
              <input
                className="input"
                value={storeSettings.footer_copyright}
                onChange={e => setStoreSettings(p => ({ ...p, footer_copyright: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={savingStore} className="btn-primary w-full justify-center">
              {savingStore ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Store Settings</>}
            </button>
          </form>
        </div>

        {/* Data Cleanup (Manual Button) */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Data Cleanup</h2>
              <p className="text-xs text-gray-500">Permanently delete soft‑deleted user data older than retention period.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={async () => {
                if (!confirm('This action will permanently delete all soft-deleted user data older than the retention period. This cannot be undone. Continue?')) return;
                const res = await fetch('/api/admin/cleanup', { method: 'POST' });
                const data = await res.json();
                alert(data.message || 'Cleanup completed.');
              }}
              className="btn-primary w-full justify-center bg-red-600 hover:bg-red-700"
            >
              Run Cleanup Now
            </button>
            <p className="text-xs text-gray-500">This operation also runs automatically daily via Vercel Cron Jobs.</p>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Send size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Social Links</h2>
              <p className="text-xs text-gray-500">Connect storefront footer to business accounts</p>
            </div>
          </div>
          <form onSubmit={saveSocialLinks} className="p-6 space-y-4">
            <input
              className="input"
              placeholder="Instagram URL"
              value={socialLinks.instagram}
              onChange={e => setSocialLinks(p => ({ ...p, instagram: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Twitter/X URL"
              value={socialLinks.twitter}
              onChange={e => setSocialLinks(p => ({ ...p, twitter: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Facebook URL"
              value={socialLinks.facebook}
              onChange={e => setSocialLinks(p => ({ ...p, facebook: e.target.value }))}
            />
            <input
              className="input"
              placeholder="TikTok URL"
              value={socialLinks.tiktok}
              onChange={e => setSocialLinks(p => ({ ...p, tiktok: e.target.value }))}
            />
            <input
              className="input"
              placeholder="WhatsApp Link (wa.me/...)"
              value={socialLinks.whatsapp}
              onChange={e => setSocialLinks(p => ({ ...p, whatsapp: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Business Email"
              value={socialLinks.email}
              onChange={e => setSocialLinks(p => ({ ...p, email: e.target.value }))}
            />
            {socialMessage && <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl">{socialMessage}</p>}
            <button type="submit" disabled={socialLoading} className="btn-primary w-full justify-center gap-2">
              {socialLoading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} />Save Links</>}
            </button>
          </form>
        </div>
      </div>

      {/* System Settings Info */}
      <div className="mt-8 bg-orange-50 rounded-2xl border border-orange-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <SettingsIcon size={18} className="text-orange-600" />
          <h3 className="font-semibold text-orange-800">Pro Tip</h3>
        </div>
        <p className="text-sm text-orange-700">
          You can manage <strong>email templates</strong>, <strong>promotional banners</strong>, <strong>order status messages</strong>, and <strong>payment providers</strong> from the quick links above.
          All settings are saved instantly and affect the customer experience in real-time.
        </p>
      </div>
    </div>
  );
}
