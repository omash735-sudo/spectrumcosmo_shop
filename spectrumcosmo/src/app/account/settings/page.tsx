'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2 } from 'lucide-react'
import { useSettings } from '@/components/storefront/SettingsProvider'
import type { CurrencyCode } from '@/lib/currency'

export default function SettingsPage() {
  const { settings, update } = useSettings()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    newsletterSubscribed: true,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const loadUser = async () => {
    setLoading(true)

    const res = await fetch('/api/auth/me')
    if (!res.ok) {
      window.location.href = '/login'
      return
    }

    const data = await res.json()
    setUser(data.user)

    setForm({
      name: data.user?.name || '',
      phone: data.user?.phone || '',
      newsletterSubscribed: Boolean(data.user?.newsletter_subscribed ?? true),
    })

    setLoading(false)
  }

  useEffect(() => {
    loadUser()
  }, [])

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    await loadUser()
    setSaving(false)
  }

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setSaving(true)

    await fetch('/api/auth/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    })

    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })

    setSaving(false)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-600" />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-6">

          {/* PROFILE SETTINGS */}
          <section className="bg-white rounded-2xl border p-6">
            <h2 className="text-xl font-bold mb-4">Profile Settings</h2>

            <form onSubmit={updateProfile} className="space-y-4">

              <input
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />

              <input className="input bg-gray-100" value={user.email} readOnly />

              <input
                className="input"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.newsletterSubscribed}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      newsletterSubscribed: e.target.checked,
                    }))
                  }
                />
                Newsletter
              </label>

              <button className="btn-primary w-full" disabled={saving}>
                Save Profile
              </button>
            </form>
          </section>

          {/* SETTINGS PANEL (REAL FUNCTIONAL SETTINGS) */}
          <section className="bg-white rounded-2xl border p-6 space-y-4">

            <h2 className="text-xl font-bold">App Settings</h2>

            {/* CURRENCY */}
            <div>
              <p className="text-sm font-medium mb-1">Currency</p>
              <select
                className="input"
                value={settings.currency}
                onChange={(e) =>
                  update({ currency: e.target.value as CurrencyCode })
                }
              >
                <option value="USD">USD</option>
                <option value="MWK">MWK</option>
                <option value="ZAR">ZAR</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            {/* DARK MODE */}
            <label className="flex justify-between items-center">
              Dark Mode
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => update({ darkMode: e.target.checked })}
              />
            </label>

            {/* EMAIL */}
            <label className="flex justify-between items-center">
              Email Notifications
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  update({ emailNotifications: e.target.checked })
                }
              />
            </label>

            {/* SMS */}
            <label className="flex justify-between items-center">
              SMS Alerts
              <input
                type="checkbox"
                checked={settings.smsAlerts}
                onChange={(e) => update({ smsAlerts: e.target.checked })}
              />
            </label>

            {/* LANGUAGE */}
            <select
              className="input"
              value={settings.language}
              onChange={(e) => update({ language: e.target.value })}
            >
              <option>English</option>
              <option>French</option>
              <option>Spanish</option>
            </select>

          </section>

          {/* PASSWORD */}
          <section className="bg-white rounded-2xl border p-6 md:col-span-2">

            <h2 className="text-xl font-bold mb-4">Security</h2>

            <form onSubmit={updatePassword} className="grid gap-3">

              <input
                type="password"
                className="input"
                placeholder="Current Password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    currentPassword: e.target.value,
                  }))
                }
              />

              <input
                type="password"
                className="input"
                placeholder="New Password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    newPassword: e.target.value,
                  }))
                }
              />

              <input
                type="password"
                className="input"
                placeholder="Confirm Password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    confirmPassword: e.target.value,
                  }))
                }
              />

              <button className="btn-primary">
                Update Password
              </button>

            </form>

          </section>

        </div>
      </main>

      <Footer />
    </>
  )
}
