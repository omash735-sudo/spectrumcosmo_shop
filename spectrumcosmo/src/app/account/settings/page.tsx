'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
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

              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  className="input bg-gray-100"
                  value={user.email}
                  readOnly
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>

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
                Receive newsletter updates
              </label>

              <button className="btn-primary w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </section>

          {/* PASSWORD SETTINGS */}
          <section className="bg-white rounded-2xl border p-6">
            <h2 className="text-xl font-bold mb-4">Security</h2>

            <form onSubmit={updatePassword} className="space-y-4">

              <div>
                <label className="text-sm text-gray-600">Current Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">New Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      newPassword: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Confirm Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>

              <button className="btn-primary w-full" disabled={saving}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>

        </div>
      </main>

      <Footer />
    </>
  )
}
