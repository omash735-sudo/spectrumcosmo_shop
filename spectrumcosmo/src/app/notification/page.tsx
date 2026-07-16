'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Mail, Smartphone, Save, Loader2, Clock, Sparkles, CheckCircle } from 'lucide-react'
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
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.push('/login')
          return
        }
        const data = await res.json()
        setUser(data.user)
        setLocalSettings({
          emailNotifications: settings.emailNotifications ?? true,
          smsAlerts: settings.smsAlerts ?? false,
          orderUpdates: true,
          promotions: false
        })
      } catch (error) {
        console.error('Failed to load user:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
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
      
      const res = await fetch('/api/user/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderUpdates: localSettings.orderUpdates,
          promotions: localSettings.promotions
        })
      })
      
      if (!res.ok) throw new Error('Failed to save')
      
      toast.success('Notification settings saved!')
    } catch (error) {
      console.error('Failed to save settings:', error)
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
          <div className="text-center">
            <Loader2 className="animate-spin text-[var(--primary)] mx-auto" size={32} />
            <p className="text-[var(--foreground-muted)] text-sm mt-3">Loading your preferences...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] py-4 sm:py-6 md:py-10">
        <div className="max-w-2xl mx-auto px-3 sm:px-4">
          <div className="bg-[var(--background-card)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
            
            {/* Header */}
            <div className="p-4 sm:p-5 md:p-6 border-b border-[var(--border)] bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="text-[var(--primary)]" size={18} />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">Notification Centre</h1>
                  <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">Manage how and when we reach you</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 md:p-6 space-y-1">
              {/* Email Notifications */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:py-4 px-3 rounded-xl hover:bg-[var(--background-secondary)] transition-colors gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--background-secondary)] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="text-[var(--foreground-muted)]" size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--foreground)] text-sm sm:text-base">Email Notifications</p>
                    <p className="text-xs sm:text-sm text-[var(--foreground-muted)] truncate">Receive updates via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={localSettings.emailNotifications}
                    onChange={(e) => setLocalSettings({...localSettings, emailNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* SMS Alerts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:py-4 px-3 rounded-xl hover:bg-[var(--background-secondary)] transition-colors gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--background-secondary)] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Smartphone className="text-[var(--foreground-muted)]" size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--foreground)] text-sm sm:text-base">SMS Alerts</p>
                    <p className="text-xs sm:text-sm text-[var(--foreground-muted)] truncate">Text message updates for orders</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={localSettings.smsAlerts}
                    onChange={(e) => setLocalSettings({...localSettings, smsAlerts: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* Order Updates */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:py-4 px-3 rounded-xl hover:bg-[var(--background-secondary)] transition-colors gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--background-secondary)] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell className="text-[var(--foreground-muted)]" size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--foreground)] text-sm sm:text-base">Order Updates</p>
                    <p className="text-xs sm:text-sm text-[var(--foreground-muted)] truncate">Shipping, delivery, and returns</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={localSettings.orderUpdates}
                    onChange={(e) => setLocalSettings({...localSettings, orderUpdates: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* Promotions & Offers */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:py-4 px-3 rounded-xl hover:bg-[var(--background-secondary)] transition-colors gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--background-secondary)] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="text-[var(--foreground-muted)]" size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--foreground)] text-sm sm:text-base">Promotions & Offers</p>
                    <p className="text-xs sm:text-sm text-[var(--foreground-muted)] truncate">Discounts, sales, and exclusive deals</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={localSettings.promotions}
                    onChange={(e) => setLocalSettings({...localSettings, promotions: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* Save Button */}
              <button 
                onClick={saveSettings} 
                disabled={saving} 
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3 sm:py-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-4 sm:mt-6 shadow-sm hover:shadow-md min-h-[48px] text-sm sm:text-base"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
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
