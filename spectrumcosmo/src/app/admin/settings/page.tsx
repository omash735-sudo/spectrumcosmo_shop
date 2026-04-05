'use client'

import { useState } from 'react'
import { KeyRound, Loader2, Save, FileText, Send } from 'lucide-react'

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Settings & Content</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account security and website content.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Security / Password */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316]">
              <KeyRound size={20} />
            </div>
            <h2 className="font-bold text-[#111111]">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                required
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                onChange={(e) => setNewPassword(e.target.value)}
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

        {/* Content Management placeholders */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm opacity-60">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-[#111111]">About Us Content</h2>
                  <p className="text-xs text-gray-500">Feature coming soon</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 pointer-events-none">
              <div>
                <label className="label">Header Image URL</label>
                <input className="input" disabled placeholder="https://..." />
              </div>
              <div>
                <label className="label">Story Text</label>
                <textarea className="input resize-none" disabled rows={3} placeholder="SpectrumCosmo was born from..." />
              </div>
              <button disabled className="btn-primary w-full justify-center gap-2"><Save size={16} /> Save Content</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm opacity-60">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Send size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-[#111111]">Newsletter / News</h2>
                  <p className="text-xs text-gray-500">Feature coming soon</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 pointer-events-none">
              <div>
                <label className="label">Latest News Title</label>
                <input className="input" disabled placeholder="New drop next week!" />
              </div>
              <button disabled className="btn-primary w-full justify-center gap-2"><Send size={16} /> Send to Subscribers</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
