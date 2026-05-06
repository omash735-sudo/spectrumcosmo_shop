'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Mail, Smartphone, Save, Loader2 } from 'lucide-react'
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
    await update({
      emailNotifications: localSettings.emailNotifications,
      smsAlerts: localSettings.smsAlerts
    })
    // Simulate saving to backend for additional settings
    await fetch('/api/user/notification-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderUpdates: localSettings.orderUpdates,
        promotions: localSettings.promotions
      })
    })
    setSaving(false)
    alert('Notification settings saved!')
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin" size={32} />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="text-[#F97316]" size={28} />
              <h1 className="text-2xl font-bold dark:text-white">Notification Preferences</h1>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Mail className="text-gray-500" size={20} />
                  <div>
                    <p className="font-medium dark:text-white">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.emailNotifications}
                    onChange={(e) => setLocalSettings({...localSettings, emailNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#F97316]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Smartphone className="text-gray-500" size={20} />
                  <div>
                    <p className="font-medium dark:text-white">SMS Alerts</p>
                    <p className="text-sm text-gray-500">Text message updates for orders</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.smsAlerts}
                    onChange={(e) => setLocalSettings({...localSettings, smsAlerts: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#F97316]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Bell className="text-gray-500" size={20} />
                  <div>
                    <p className="font-medium dark:text-white">Order Updates</p>
                    <p className="text-sm text-gray-500">Shipping, delivery, and returns</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.orderUpdates}
                    onChange={(e) => setLocalSettings({...localSettings, orderUpdates: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#F97316]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Mail className="text-gray-500" size={20} />
                  <div>
                    <p className="font-medium dark:text-white">Promotions & Offers</p>
                    <p className="text-sm text-gray-500">Discounts, sales, and exclusive deals</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.promotions}
                    onChange={(e) => setLocalSettings({...localSettings, promotions: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#F97316]"></div>
                </label>
              </div>

              <button onClick={saveSettings} disabled={saving} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
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
