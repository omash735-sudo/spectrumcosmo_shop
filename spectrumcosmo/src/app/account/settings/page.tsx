'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, MapPin, DollarSign, Globe, Bell, Mail, Star, Shield, FileText, Trash2,
  Loader2, X, Star as StarIcon, FileCheck, Lock, KeyRound
} from 'lucide-react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import CurrencySelector from '@/components/storefront/CurrencySelector'

export default function SettingsPage() {
  const router = useRouter()
  const { currency } = useCurrency()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Rating modal
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  
  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
      setLoading(false)
    }
    loadUser()
  }, [router])

  const handleRatingSubmit = async () => {
    if (rating === 0) return
    setRatingSubmitting(true)
    await fetch('/api/rating', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stars: rating, comment: ratingComment })
    })
    setRatingSubmitting(false)
    setShowRatingModal(false)
    setRating(0)
    setRatingComment('')
    alert('Thank you for your rating!')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
    if (res.ok) {
      router.push('/')
    } else {
      alert('Failed to delete account')
    }
    setDeleting(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    setChangingPassword(true)
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    })
    const data = await res.json()
    if (res.ok) {
      setPasswordSuccess('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setShowPasswordModal(false), 1500)
    } else {
      setPasswordError(data.error || 'Failed to change password')
    }
    setChangingPassword(false)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="animate-spin text-gray-600" size={32} />
        </main>
        <Footer />
      </>
    )
  }

  const settingsItems = [
    { icon: User, label: 'Profile', href: '/account/profile', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    { icon: MapPin, label: 'Address', href: '/account/addresses', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    { icon: DollarSign, label: 'Currency', action: 'currency', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
    { icon: Globe, label: 'Language', value: 'English', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    { icon: Bell, label: 'Notifications', href: '/notification', bgColor: 'bg-red-50', textColor: 'text-red-600' },
    { icon: Mail, label: 'Newsletter', href: '/newsletter', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
    { icon: Star, label: 'Rate Us', action: 'rating', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
    { icon: Lock, label: 'Security', action: 'password', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
    { icon: Shield, label: 'Privacy Policy', href: '/privacy', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
    { icon: FileCheck, label: 'Terms & Conditions', href: '/terms', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
    { icon: Trash2, label: 'Delete Account', action: 'delete', bgColor: 'bg-red-50', textColor: 'text-red-600' }
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Business Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"
              alt="SpectrumCosmo"
              className="h-16 md:h-20 w-auto object-contain"
            />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 mt-1">Manage your account preferences and security</p>
          </div>

          {/* Settings Grid - 3 columns on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {settingsItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (item.href) router.push(item.href)
                  if (item.action === 'rating') setShowRatingModal(true)
                  if (item.action === 'delete') setShowDeleteModal(true)
                  if (item.action === 'currency') {
                    document.getElementById('currency-selector-trigger')?.click()
                  }
                  if (item.action === 'password') setShowPasswordModal(true)
                }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition group"
              >
                <div className={`${item.bgColor} p-3 rounded-full ${item.textColor}`}>
                  <item.icon size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{item.label}</h3>
                  {item.value && <p className="text-sm text-gray-500">{item.value}</p>}
                  {item.label === 'Currency' && (
                    <p className="text-sm text-gray-500">Current: {currency}</p>
                  )}
                </div>
                <span className="text-gray-400 group-hover:translate-x-1 transition">→</span>
              </div>
            ))}
          </div>

          {/* Hidden Currency Selector */}
          <div className="hidden">
            <CurrencySelector />
            <button id="currency-selector-trigger" onClick={() => {}} />
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Rate SpectrumCosmo</h3>
              <button onClick={() => setShowRatingModal(false)} className="text-gray-500"><X size={24} /></button>
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <StarIcon
                    size={40}
                    className={`${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition`}
                  />
                </button>
              ))}
            </div>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2 mb-4"
              rows={3}
              placeholder="Optional: Share your experience..."
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
            />
            <button
              onClick={handleRatingSubmit}
              disabled={rating === 0 || ratingSubmitting}
              className="w-full bg-[#F97316] text-white py-2 rounded-xl font-medium hover:bg-[#e0650f] disabled:opacity-50"
            >
              {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-2">Delete Account</h3>
            <p className="text-gray-600 mb-4">
              This action is irreversible. All your data, orders, and profile will be permanently deleted.
            </p>
            <p className="text-sm font-medium mb-2">Type <span className="font-mono bg-gray-100 px-2 py-1 rounded">DELETE</span> to confirm:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 mb-4"
              placeholder="DELETE"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border rounded-xl hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-500"><X size={24} /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              {passwordError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{passwordSuccess}</p>}
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full bg-[#F97316] text-white py-2 rounded-xl font-medium hover:bg-[#e0650f] disabled:opacity-50"
              >
                {changingPassword ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
                       }
