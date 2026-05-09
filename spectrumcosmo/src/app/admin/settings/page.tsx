'use client'

import { useEffect, useState } from 'react'
import { KeyRound, Loader2, Save, Send, Database, Building2, Clock } from 'lucide-react'

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialMessage, setSocialMessage] = useState('')
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    twitter: '',
    facebook: '',
    tiktok: '',
    whatsapp: '',
    email: 'spectrumcosmo01@gmail.com',
  })
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'SpectrumCosmo',
    store_email: 'spectrumcosmo01@gmail.com',
    store_address: 'Lilongwe, Malawi',
    data_retention_days: '2555',
  })
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [savingStore, setSavingStore] = useState(false)

  useEffect(() => {
    fetch('/api/admin/social-links')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSocialLinks(prev => ({ ...prev, ...data })) })
      .catch(() => null)

    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setStoreSettings(prev => ({
          ...prev,
          store_name: data.store_name || prev.store_name,
          store_email: data.store_email || prev.store_email,
          store_address: data.store_address || prev.store_address,
          data_retention_days: data.data_retention_days || prev.data_retention_days,
        }))
        setSettingsLoading(false)
      })
      .catch(() => setSettingsLoading(false))
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    const res = await fetch('/api/admin/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setMessage('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
    } else {
      setError(data.error || 'Failed to update password.')
    }
  }

  const saveSocialLinks = async (e: React.FormEvent) => {
    e.preventDefault()
    setSocialLoading(true)
    setSocialMessage('')
    const res = await fetch('/api/admin/social-links', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(socialLinks),
    })
    setSocialLoading(false)
    setSocialMessage(res.ok ? 'Social links saved.' : 'Failed to save social links.')
  }

  const saveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingStore(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeSettings),
    })
    setSavingStore(false)
    if (res.ok) alert('Store settings saved.')
    else alert('Failed to save settings.')
  }

  if (settingsLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={32} /></div>

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings & Content</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account security, store information, and website content.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Password Change */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600"><KeyRound size={20} /></div>
            <h2 className="font-bold text-gray-800">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            <div><label className="label">Current Password</label><input type="password" required className="input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" /></div>
            <div><label className="label">New Password</label><input type="password" required minLength={8} className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" /></div>
            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
            {message && <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl">{message}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}</button>
          </form>
        </div>

        {/* Store Information & Data Retention */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Building2 size={20} /></div>
            <h2 className="font-bold text-gray-800">Store Settings</h2>
          </div>
          <form onSubmit={saveStoreSettings} className="p-6 space-y-4">
            <div><label>Store Name</label><input className="input" value={storeSettings.store_name} onChange={e => setStoreSettings(p => ({ ...p, store_name: e.target.value }))} /></div>
            <div><label>Store Email</label><input className="input" type="email" value={storeSettings.store_email} onChange={e => setStoreSettings(p => ({ ...p, store_email: e.target.value }))} /></div>
            <div><label>Store Address</label><input className="input" value={storeSettings.store_address} onChange={e => setStoreSettings(p => ({ ...p, store_address: e.target.value }))} /></div>
            <div><label>Data Retention (days)</label><input type="number" className="input" value={storeSettings.data_retention_days} onChange={e => setStoreSettings(p => ({ ...p, data_retention_days: e.target.value }))} /><p className="text-xs text-gray-500">Number of days before soft‑deleted user data is permanently removed.</p></div>
            <button type="submit" disabled={savingStore} className="btn-primary w-full justify-center">{savingStore ? <Loader2 size={16} className="animate-spin" /> : 'Save Store Settings'}</button>
          </form>
        </div>

        {/* Data Cleanup (Manual Button) */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600"><Clock size={20} /></div>
            <div><h2 className="font-bold text-gray-800">Data Cleanup</h2><p className="text-xs text-gray-500">Permanently delete soft‑deleted user data older than retention period.</p></div>
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
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><Send size={20} /></div>
            <div><h2 className="font-bold text-gray-800">Social Links</h2><p className="text-xs text-gray-500">Connect storefront footer to business accounts</p></div>
          </div>
          <form onSubmit={saveSocialLinks} className="p-6 space-y-4">
            <input className="input" placeholder="Instagram URL" value={socialLinks.instagram} onChange={e => setSocialLinks(p => ({ ...p, instagram: e.target.value }))} />
            <input className="input" placeholder="Twitter/X URL" value={socialLinks.twitter} onChange={e => setSocialLinks(p => ({ ...p, twitter: e.target.value }))} />
            <input className="input" placeholder="Facebook URL" value={socialLinks.facebook} onChange={e => setSocialLinks(p => ({ ...p, facebook: e.target.value }))} />
            <input className="input" placeholder="TikTok URL" value={socialLinks.tiktok} onChange={e => setSocialLinks(p => ({ ...p, tiktok: e.target.value }))} />
            <input className="input" placeholder="WhatsApp Link (wa.me/...)" value={socialLinks.whatsapp} onChange={e => setSocialLinks(p => ({ ...p, whatsapp: e.target.value }))} />
            <input className="input" placeholder="Business Email" value={socialLinks.email} onChange={e => setSocialLinks(p => ({ ...p, email: e.target.value }))} />
            {socialMessage && <p className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl">{socialMessage}</p>}
            <button type="submit" disabled={socialLoading} className="btn-primary w-full justify-center gap-2">{socialLoading ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} />Save Links</>}</button>
          </form>
        </div>
      </div>
    </div>
  )
            }
