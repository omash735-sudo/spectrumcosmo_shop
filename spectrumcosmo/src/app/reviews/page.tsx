'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import LiveReviews from '@/components/storefront/LiveReviews'
import StarRating from '@/components/ui/StarRating'
import Image from 'next/image'
import { Loader2, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  reviewing: { label: 'Reviewing', icon: AlertCircle, color: 'text-blue-600 bg-blue-50' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  denied: { label: 'Denied', icon: XCircle, color: 'text-red-600 bg-red-50' },
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [allReviews, setAllReviews] = useState<any[]>([])
  const [myReviews, setMyReviews] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loadingAll, setLoadingAll] = useState(true)
  const [loadingMy, setLoadingMy] = useState(false)

  useEffect(() => {
    // Fetch all approved reviews
    const fetchAll = async () => {
      setLoadingAll(true)
      try {
        const res = await fetch('/api/reviews')
        const data = await res.json()
        setAllReviews(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingAll(false)
      }
    }
    fetchAll()
  }, [])

  useEffect(() => {
    // Only fetch user reviews if logged in and tab is "my"
    const fetchMy = async () => {
      if (!user && activeTab === 'my') {
        // Try to get user
        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) {
          const meData = await meRes.json()
          if (meData.user) {
            setUser(meData.user)
          } else {
            setUser(null)
            return
          }
        } else {
          setUser(null)
          return
        }
      }
      if (user && activeTab === 'my') {
        setLoadingMy(true)
        try {
          const res = await fetch(`/api/reviews?user_id=${user.id}`)
          const data = await res.json()
          setMyReviews(Array.isArray(data) ? data : [])
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingMy(false)
        }
      }
    }
    fetchMy()
  }, [activeTab, user])

  return (
    <>
      <Navbar />
      <main className="bg-white min-h-screen py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#F97316] font-medium text-sm uppercase tracking-widest mb-2">Testimonials</p>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Customer Reviews</h1>
            <p className="text-gray-500 max-w-xl mx-auto">See what our customers are saying about SpectrumCosmo products.</p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === 'all'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                All Reviews
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === 'my'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                My Reviews
              </button>
            </div>
          </div>

          {/* All Reviews Tab */}
          {activeTab === 'all' && (
            loadingAll ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
            ) : (
              <LiveReviews initialReviews={allReviews} />
            )
          )}

          {/* My Reviews Tab */}
          {activeTab === 'my' && (
            !user ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl">
                <p className="text-gray-500">Please login to see your reviews.</p>
                <a href="/login" className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-full">Login</a>
              </div>
            ) : loadingMy ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
            ) : myReviews.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl">
                <p className="text-gray-500">You haven't written any reviews yet.</p>
                <a href="/reviews/submit" className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-full">Write a Review</a>
              </div>
            ) : (
              <div className="space-y-6">
                {myReviews.map((review) => {
                  const StatusIcon = statusConfig[review.status]?.icon || AlertCircle
                  const statusClass = statusConfig[review.status]?.color || 'text-gray-600 bg-gray-50'

                  return (
                    <div key={review.id} className="bg-white border rounded-xl p-6 shadow-sm">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div>
                          <StarRating rating={review.rating} />
                          {review.product_name && (
                            <p className="text-sm text-gray-500 mt-1">Product: {review.product_name}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                          <StatusIcon size={12} />
                          {statusConfig[review.status]?.label || review.status}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-4">"{review.review_text}"</p>
                      {review.image_url && (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border mt-2">
                          <Image src={review.image_url} alt="Review" fill className="object-cover" />
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-3">
                        Submitted on {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
