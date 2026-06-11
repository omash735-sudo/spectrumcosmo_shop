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
        <main className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <Loader2 className="animate-spin text-[#F97316]" size={32} />
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
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
              <Bell className="text-[#F97316]" size={24} />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Notification Preferences</h1>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Email Notifications */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="text-gray-500 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Email Notifications</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.emailNotifications}
                    onChange={(e) => setLocalSettings({...localSettings, emailNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#F97316]"></div>
                </label>
              </div>

              {/* SMS Alerts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <Smartphone className="text-gray-500 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">SMS Alerts</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Text message updates for orders</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.smsAlerts}
                    onChange={(e) => setLocalSettings({...localSettings, smsAlerts: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#F97316]"></div>
                </label>
              </div>

              {/* Order Updates */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="text-gray-500 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Order Updates</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Shipping, delivery, and returns</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.orderUpdates}
                    onChange={(e) => setLocalSettings({...localSettings, orderUpdates: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#F97316]"></div>
                </label>
              </div>

              {/* Promotions & Offers */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="text-gray-500 dark:text-gray-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Promotions & Offers</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Discounts, sales, and exclusive deals</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-11 sm:ml-0">
                  <input
                    type="checkbox"
                    checked={localSettings.promotions}
                    onChange={(e) => setLocalSettings({...localSettings, promotions: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#F97316]"></div>
                </label>
              </div>

              {/* Save Button */}
              <button 
                onClick={saveSettings} 
                disabled={saving} 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 sm:py-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-4 sm:mt-6 shadow-md hover:shadow-lg"
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
