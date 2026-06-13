'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Mail, Smartphone, Save, Loader2, Trash2, CheckCircle, Clock } from 'lucide-react'
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
    await fetch('/api/user/notification-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderUpdates: localSettings.orderUpdates,
        promotions: localSettings.promotions
      })
    })
    setSaving(false)
    // Use toast instead of alert for better UX
    alert('Notification settings saved!')
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <Loader2 className="animate-spin text-orange-500 dark:text-orange-400" size={32} />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 sm:py-8 md:py-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Bell className="text-orange-600 dark:text-orange-400" size={20} />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Notification Centre</h1>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Clock size={12} />
                <span>Preferences</span>
              </div>
            </div>

            <div className="space-y-1">
              {/* Email Notifications */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="text-gray-500 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.emailNotifications}
                    onChange={(e) => setLocalSettings({...localSettings, emailNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500 dark:peer-checked:bg-orange-400"></div>
                </label>
              </div>

              {/* SMS Alerts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Smartphone className="text-gray-500 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">SMS Alerts</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Text message updates for orders</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.smsAlerts}
                    onChange={(e) => setLocalSettings({...localSettings, smsAlerts: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500 dark:peer-checked:bg-orange-400"></div>
                </label>
              </div>

              {/* Order Updates */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell className="text-gray-500 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Order Updates</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Shipping, delivery, and returns</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.orderUpdates}
                    onChange={(e) => setLocalSettings({...localSettings, orderUpdates: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500 dark:peer-checked:bg-orange-400"></div>
                </label>
              </div>

              {/* Promotions & Offers */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="text-gray-500 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Promotions & Offers</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Discounts, sales, and exclusive deals</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.promotions}
                    onChange={(e) => setLocalSettings({...localSettings, promotions: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500 dark:peer-checked:bg-orange-400"></div>
                </label>
              </div>

              {/* Save Button */}
              <button 
                onClick={saveSettings} 
                disabled={saving} 
                className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white py-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-6 shadow-sm hover:shadow-md"
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
