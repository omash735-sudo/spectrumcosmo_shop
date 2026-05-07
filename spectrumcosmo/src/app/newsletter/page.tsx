'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, CheckCircle, Loader2, Newspaper, Bell, Tag, Shield, X } from 'lucide-react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

export default function NewsletterPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subscribed, setSubscribed] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Feedback modal state
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackReason, setFeedbackReason] = useState('')
  const [feedbackDetails, setFeedbackDetails] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
      setSubscribed(data.user?.newsletter_subscribed ?? true)
      setLoading(false)
    }
    loadUser()
  }, [router])

  // Core unsubscribe API call (without feedback)
  const performUnsubscribe = async () => {
    setSaving(true)
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterSubscribed: false })
      })
      setSubscribed(false)
    } catch (error) {
      console.error('Failed to update subscription', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Core subscribe API call
  const performSubscribe = async () => {
    setSaving(true)
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterSubscribed: true })
      })
      setSubscribed(true)
    } catch (error) {
      console.error('Failed to update subscription', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Open modal on unsubscribe attempt
  const handleUnsubscribeClick = () => {
    setShowFeedback(true)
  }

  // Submit feedback then unsubscribe
  const submitFeedbackAndUnsubscribe = async () => {
    setSubmittingFeedback(true)
    try {
      // Send feedback to the API
      await fetch('/api/subscribe/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          reason: feedbackReason,
          details: feedbackDetails,
        }),
      })
      // Then unsubscribe
      await performUnsubscribe()
      // Close modal and reset
      setShowFeedback(false)
      setFeedbackReason('')
      setFeedbackDetails('')
    } catch (err) {
      console.error('Feedback submission failed', err)
      // Still unsubscribe even if feedback fails
      await performUnsubscribe()
      setShowFeedback(false)
      alert('You have been unsubscribed (feedback could not be saved).')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const toggleSubscription = async () => {
    if (subscribed) {
      // User is currently subscribed → we want to unsubscribe, so show modal
      handleUnsubscribeClick()
    } else {
      // User is not subscribed → they want to subscribe, do it directly
      await performSubscribe()
    }
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
              <h1 className="text-3xl font-bold mb-2 dark:text-white">SpectrumCosmo Newsletter</h1>
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

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold dark:text-white">We're sad to see you go</h3>
              <button
                onClick={() => setShowFeedback(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Please tell us why you're unsubscribing:</p>
            <select
              value={feedbackReason}
              onChange={(e) => setFeedbackReason(e.target.value)}
              className="w-full p-2 border rounded-lg mb-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select a reason...</option>
              <option>Too many emails</option>
              <option>Content not relevant</option>
              <option>Didn't sign up for this</option>
              <option>Other</option>
            </select>
            <textarea
              value={feedbackDetails}
              onChange={(e) => setFeedbackDetails(e.target.value)}
              placeholder="Optional: any additional feedback?"
              rows={3}
              className="w-full p-2 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedbackAndUnsubscribe}
                disabled={submittingFeedback}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700 disabled:opacity-50"
              >
                {submittingFeedback ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Unsubscribe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
