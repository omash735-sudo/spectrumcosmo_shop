'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Mail, Smartphone, Save, Loader2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useSettings } from '@/components/storefront/SettingsProvider'

export default function NotificationSettingsPage() {
  const router = useRouter()
  const { settings, update } = useSettings()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [localSettings, setLocalSettings] = useState({
    emailNotifications: true,
    smsAlerts: false,
    orderUpdates: true,
    promotions: false
  })

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
      setLocalSettings({
        emailNotifications: settings.emailNotifications,
        smsAlerts: settings.smsAlerts,
        orderUpdates: true,
        promotions: false
      })
      setLoading(false)
    }
    loadUser()
  }, [router, settings])

  const saveSettings = async () => {
    setSaving(true)
    try {
      await update({
        emailNotifications: localSettings.emailNotifications,
        smsAlerts: localSettings.smsAlerts
      })
      await fetch('/api/user/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderUpdates: localSettings.orderUpdates,
          promotions: localSettings.promotions
        })
      })
      toast.success('Notification settings saved!')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <Loader2 className="animate-spin text-[var(--primary])" size={32} />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] py-6 sm:py-8 md:py-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-[var(--background-card)] rounded-2xl shadow-sm border border-[var(--border)] p-4 sm:p-6">
            
            {/* Header - With Manga Panel */}
            <div className="manga-bg cards-manga rounded-xl overflow-hidden mb-6">
              <div className="relative z-10 flex items-center justify-between p-4 sm:p-5 bg-[var(--background-card)]/95">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
                    <Bell className="text-[var(--primary)]" size={20} />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Notification Centre</h1>
                </div>
                <div className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                  <Clock size={12} />
                  <span>Preferences</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {/* Email Notifications */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-3 rounded-xl hover:bg-[var(--background-secondary)] transition-colors gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--background-secondary)] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="text-[var(--foreground-muted)]" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Email Notifications</p>
                    <p className="text-sm text-[var(--foreground-muted)]">Receive updates via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.emailNotifications}
                    onChange={(e) => setLocalSettings({...localSettings, emailNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[var(--border)] peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* SMS Alerts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-3 rounded-xl hover:bg-[var(--background-secondary)] transition-colors gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--background-secondary)] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Smartphone className="text-[var(--foreground-muted)]" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">SMS Alerts</p>
                    <p className="text-sm text-[var(--foreground-muted)]">Text message updates for orders</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.smsAlerts}
                    onChange={(e) => setLocalSettings({...localSettings, smsAlerts: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[var(--border)] peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* Order Updates */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-3 rounded-xl hover:bg-[var(--background-secondary)] transition-colors gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--background-secondary)] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell className="text-[var(--foreground-muted)]" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Order Updates</p>
                    <p className="text-sm text-[var(--foreground-muted)]">Shipping, delivery, and returns</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.orderUpdates}
                    onChange={(e) => setLocalSettings({...localSettings, orderUpdates: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[var(--border)] peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* Promotions & Offers */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-3 rounded-xl hover:bg-[var(--background-secondary)] transition-colors gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--background-secondary)] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="text-[var(--foreground-muted)]" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Promotions & Offers</p>
                    <p className="text-sm text-[var(--foreground-muted)]">Discounts, sales, and exclusive deals</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.promotions}
                    onChange={(e) => setLocalSettings({...localSettings, promotions: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[var(--border)] peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* Save Button */}
              <button 
                onClick={saveSettings} 
                disabled={saving} 
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-6 shadow-sm hover:shadow-md"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
