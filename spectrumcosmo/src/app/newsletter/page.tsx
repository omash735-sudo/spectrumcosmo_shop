'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, CheckCircle, Loader2, Newspaper, Bell, Tag, Shield } from 'lucide-react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

export default function NewsletterPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subscribed, setSubscribed] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
      // Fallback: if user object has newsletter_subscribed field
      setSubscribed(data.user?.newsletter_subscribed ?? true)
      setLoading(false)
    }
    loadUser()
  }, [router])

  const toggleSubscription = async () => {
    setSaving(true)
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterSubscribed: !subscribed })
      })
      setSubscribed(!subscribed)
    } catch (error) {
      console.error('Failed to update subscription', error)
      alert('Something went wrong. Please try again.')
    }
    setSaving(false)
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border dark:border-gray-700 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#F97316]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Newspaper className="text-[#F97316]" size={40} />
              </div>
              <h1 className="text-3xl font-bold mb-2 dark:text-white">Spectrumcosmo Newsletter</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Be the first to know about new arrivals, exclusive deals, and tech insights.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <Tag className="text-[#F97316]" size={20} />
                <span className="text-sm font-medium dark:text-white">Early access to sales</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <Bell className="text-[#F97316]" size={20} />
                <span className="text-sm font-medium dark:text-white">Daily tech & anime drops</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <Shield className="text-[#F97316]" size={20} />
                <span className="text-sm font-medium dark:text-white">Unsubscribe anytime</span>
              </div>
            </div>

            {/* Subscription card */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="text-[#F97316]" size={24} />
                  <div>
                    <p className="font-medium dark:text-white">{user?.email || 'Your email'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {subscribed ? 'You are subscribed' : 'Not subscribed'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleSubscription}
                  disabled={saving}
                  className={`px-6 py-2 rounded-full font-medium transition ${
                    subscribed
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-[#F97316] text-white hover:bg-[#e0650f]'
                  }`}
                >
                  {saving ? <Loader2 className="animate-spin inline mr-1" size={18} /> : null}
                  {subscribed ? 'Unsubscribe' : 'Subscribe'}
                </button>
              </div>
            </div>

            {/* Success message */}
            {subscribed && (
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-3 rounded-xl">
                <CheckCircle size={20} />
                <span>You're all set! Check your inbox for a welcome email.</span>
              </div>
            )}

            {/* Frequency note */}
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>We send about 2–4 emails per month. No spam, just quality content.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
                  }
