'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Loader2, Trash2, Check, X, MessageSquare, Eye, EyeOff, Clock } from 'lucide-react'
import StarRating from '@/components/ui/StarRating'

const statusOptions = ['pending', 'reviewing', 'approved', 'denied']
const statusLabels = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  approved: 'Approved',
  denied: 'Denied',
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewing' | 'approved' | 'denied'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reviews')
      const data = await res.json()
      setReviews(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const updateReview = async (id: string, updates: any) => {
    setProcessingId(id)
    await fetch('/api/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    await fetchReviews()
    setProcessingId(null)
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return
    await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' })
    fetchReviews()
  }

  const filtered = reviews.filter(r => filter === 'all' ? true : r.status === filter)
  const pendingCount = reviews.filter(r => r.status === 'pending').length
  const reviewingCount = reviews.filter(r => r.status === 'reviewing').length

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-500 text-sm mt-1">
          {pendingCount > 0 && (
            <span className="text-orange-500 font-medium">{pendingCount} pending · </span>
          )}
          {reviewingCount > 0 && (
            <span className="text-blue-500 font-medium">{reviewingCount} reviewing · </span>
          )}
          {reviews.length} total
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'reviewing', 'approved', 'denied'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-200'
            }`}
          >
            {f === 'all' ? 'All' : statusLabels[f as keyof typeof statusLabels]}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-white/30 text-inherit text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
            {f === 'reviewing' && reviewingCount > 0 && (
              <span className="ml-1.5 bg-white/30 text-inherit text-xs px-1.5 py-0.5 rounded-full">
                {reviewingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No reviews found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Rating</th>
                  <th className="text-left px-6 py-3">Review</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r: any) => {
                  const userName = r.user_name || r.customer_name
                  const userImage = r.user_image
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50 ${r.status !== 'approved' ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {userImage ? (
                            <Image src={userImage} alt={userName} width={36} height={36} className="rounded-full object-cover w-9 h-9 flex-shrink-0" />
                          ) : r.image_url ? (
                            <Image src={r.image_url} alt={userName} width={36} height={36} className="rounded-full object-cover w-9 h-9 flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-orange-600">{userName.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-800">{userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><StarRating rating={r.rating} size={14} /></td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-gray-600 line-clamp-2">{r.review_text}</p>
                        {r.image_url && (
                          <div className="relative w-12 h-12 mt-1 rounded-md overflow-hidden">
                            <Image src={r.image_url} alt="review" fill className="object-cover" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={r.status}
                          onChange={(e) => updateReview(r.id, { status: e.target.value })}
                          disabled={processingId === r.id}
                          className="text-xs border rounded px-2 py-1 bg-white"
                        >
                          {statusOptions.map(s => (
                            <option key={s} value={s}>{statusLabels[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {processingId === r.id ? (
                            <Loader2 size={16} className="animate-spin text-orange-500" />
                          ) : (
                            <>
                              <button
                                onClick={() => deleteReview(r.id)}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
