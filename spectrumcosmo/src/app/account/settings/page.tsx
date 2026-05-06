'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, MapPin, DollarSign, Globe, Bell, Mail, Star, Shield, FileText, Trash2,
  Moon, Sun, Loader2, X, Star as StarIcon, FileCheck
} from 'lucide-react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useSettings } from '@/components/storefront/SettingsProvider'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import CurrencySelector from '@/components/storefront/CurrencySelector'

export default function SettingsPage() {
  const router = useRouter()
  const { settings, update } = useSettings()
  const { currency, setCurrency } = useCurrency()
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

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <Loader2 className="animate-spin text-gray-600 dark:text-gray-300" size={32} />
        </main>
        <Footer />
      </>
    )
  }

  // Settings items – now includes Terms & Conditions
  const settingsItems = [
    { icon: User, label: 'Profile', href: '/account/profile', bgColor: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400' },
    { icon: MapPin, label: 'Address', href: '/account/addresses', bgColor: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-600 dark:text-green-400' },
    { icon: DollarSign, label: 'Currency', action: 'currency', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', textColor: 'text-yellow-600 dark:text-yellow-400' },
    { icon: Globe, label: 'Language', value: 'English (fixed)', bgColor: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-600 dark:text-purple-400' },
    { icon: Bell, label: 'Notification settings', href: '/notification', bgColor: 'bg-red-50 dark:bg-red-900/20', textColor: 'text-red-600 dark:text-red-400' },
    { icon: Mail, label: 'Newsletter', href: '/newsletter', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', textColor: 'text-indigo-600 dark:text-indigo-400' },
    { icon: Star, label: 'Rate Spectrumcosmo', action: 'rating', bgColor: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-600 dark:text-amber-400' },
    { icon: Shield, label: 'Privacy Policy', href: '/privacy', bgColor: 'bg-gray-50 dark:bg-gray-800', textColor: 'text-gray-600 dark:text-gray-400' },
    { icon: FileCheck, label: 'Terms & Conditions', href: '/terms', bgColor: 'bg-gray-50 dark:bg-gray-800', textColor: 'text-gray-600 dark:text-gray-400' },
    { icon: FileText, label: 'Legal information', href: '/legal', bgColor: 'bg-gray-50 dark:bg-gray-800', textColor: 'text-gray-600 dark:text-gray-400' },
    { icon: Trash2, label: 'Delete Account', action: 'delete', bgColor: 'bg-red-50 dark:bg-red-900/20', textColor: 'text-red-600 dark:text-red-400' }
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Business Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"
              alt="Spectrumcosmo"
              className="h-16 md:h-20 w-auto object-contain"
            />
          </div>

          {/* Dark Mode Toggle */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.darkMode ? <Moon className="text-gray-600 dark:text-gray-300" size={20} /> : <Sun className="text-gray-600" size={20} />}
              <span className="font-medium dark:text-white">Dark Mode</span>
            </div>
            <button
              onClick={() => update({ darkMode: !settings.darkMode })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                settings.darkMode ? 'bg-[#F97316]' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${
                settings.darkMode ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition group"
              >
                <div className={`${item.bgColor} p-3 rounded-full ${item.textColor}`}>
                  <item.icon size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold dark:text-white">{item.label}</h3>
                  {item.value && <p className="text-sm text-gray-500 dark:text-gray-400">{item.value}</p>}
                  {item.label === 'Currency' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current: {currency}</p>
                  )}
                </div>
                <span className="text-gray-400 group-hover:translate-x-1 transition">→</span>
              </div>
            ))}
          </div>

          {/* Hidden Currency Selector Trigger */}
          <div className="hidden">
            <CurrencySelector />
            <button id="currency-selector-trigger" onClick={() => {}} />
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold dark:text-white">Rate Spectrumcosmo</h3>
              <button onClick={() => setShowRatingModal(false)} className="text-gray-500"><X size={24} /></button>
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <StarIcon
                    size={40}
                    className={`${
                      (hoverRating || rating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    } transition`}
                  />
                </button>
              ))}
            </div>
            <textarea
              className="input w-full mb-4"
              rows={3}
              placeholder="Optional: Share your experience..."
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
            />
            <button
              onClick={handleRatingSubmit}
              disabled={rating === 0 || ratingSubmitting}
              className="btn-primary w-full"
            >
              {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-2">Delete Account</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This action is irreversible. All your data, orders, and profile will be permanently deleted.
            </p>
            <p className="text-sm font-medium mb-2">Type <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">DELETE</span> to confirm:</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="input w-full mb-4"
              placeholder="DELETE"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex-1 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
      }
