'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import LiveReviews from '@/components/storefront/LiveReviews'
import StarRating from '@/components/ui/StarRating'
import Image from 'next/image'
import { Loader2, CheckCircle, Clock, XCircle, AlertCircle, Edit2, Save, X } from 'lucide-react'

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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [editRating, setEditRating] = useState(5)
  const [isSaving, setIsSaving] = useState(false)

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
    // Fetch current user
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user || null)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    // Fetch user's reviews when tab changes or user logs in
    const fetchMyReviews = async () => {
      if (!user) {
        setMyReviews([])
        return
      }
      if (activeTab === 'my') {
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
    fetchMyReviews()
  }, [activeTab, user])

  const handleEdit = (review: any) => {
    setEditingId(review.id)
    setEditText(review.review_text)
    setEditRating(review.rating)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
    setEditRating(5)
  }

  const handleSaveEdit = async (reviewId: number) => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewId,
          review_text: editText,
          rating: editRating,
        })
      })
      if (res.ok) {
        const updated = await res.json()
        setMyReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, review_text: updated.review_text, rating: updated.rating } : r
        ))
        handleCancelEdit()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to update review')
      }
    } catch (err) {
      alert('Error updating review')
    } finally {
      setIsSaving(false)
    }
  }

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
                  const canEdit = review.status === 'pending'
                  const isEditing = editingId === review.id

                  return (
                    <div key={review.id} className="bg-white border rounded-xl p-6 shadow-sm">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">Rating:</span>
                                <select 
                                  value={editRating} 
                                  onChange={(e) => setEditRating(parseInt(e.target.value))}
                                  className="border rounded-lg px-3 py-1.5 text-sm"
                                >
                                  {[5,4,3,2,1].map(r => (
                                    <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>
                                  ))}
                                </select>
                              </div>
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full border rounded-lg p-3 text-sm focus:ring-orange-500 focus:border-orange-500"
                                rows={4}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveEdit(review.id)}
                                  disabled={isSaving}
                                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 inline-flex items-center gap-2"
                                >
                                  <Save size={14} />
                                  {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 inline-flex items-center gap-2"
                                >
                                  <X size={14} />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <StarRating rating={review.rating} />
                              {review.product_name && (
                                <p className="text-sm text-gray-500 mt-1">Product: {review.product_name}</p>
                              )}
                              <p className="text-gray-700 text-sm leading-relaxed mt-3">"{review.review_text}"</p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                            <StatusIcon size={12} />
                            {statusConfig[review.status]?.label || review.status}
                          </span>
                          {canEdit && !isEditing && (
                            <button
                              onClick={() => handleEdit(review)}
                              className="text-orange-500 hover:text-orange-600 text-sm font-medium inline-flex items-center gap-1"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                      {!isEditing && review.image_url && (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border mt-2">
                          <Image src={review.image_url} alt="Review" fill className="object-cover" />
                        </div>
                      )}
                      {!isEditing && (
                        <p className="text-xs text-gray-400 mt-3">
                          Submitted on {new Date(review.created_at).toLocaleDateString()}
                          {review.updated_at !== review.created_at && ` (Edited on ${new Date(review.updated_at).toLocaleDateString()})`}
                        </p>
                      )}
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
