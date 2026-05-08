'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import StarRating from '../ui/StarRating'

export default function LiveReviews({ initialReviews }: { initialReviews: any[] }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [visibleCount, setVisibleCount] = useState(12)

  useEffect(() => {
    // Only fetch fresh data once (no polling)
    let mounted = true
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/reviews')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setReviews(data)
        }
      } catch (err) {
        // silently fail
      }
    }
    fetchLatest()
    return () => { mounted = false }
  }, [])

  const visibleReviews = reviews.slice(0, visibleCount)
  const galleryReviews = reviews.filter((r: any) => r.image_url).slice(0, visibleCount)

  const loadMore = () => {
    setVisibleCount(prev => prev + 12)
  }

  return (
    <>
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No reviews yet. Be the first!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {visibleReviews.map((r: any) => (
              <div key={r.id} className="card p-6 bg-white rounded-xl shadow-sm border">
                <StarRating rating={r.rating} />
                <p className="text-gray-700 text-sm leading-relaxed mt-4 mb-5 line-clamp-4">
                  "{r.review_text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  {r.user_image ? (
                    <Image src={r.user_image} alt={r.user_name || r.customer_name} width={40} height={40} className="rounded-full object-cover w-10 h-10" />
                  ) : r.image_url ? (
                    <Image src={r.image_url} alt={r.user_name || r.customer_name} width={40} height={40} className="rounded-full object-cover w-10 h-10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-600">
                        {(r.user_name || r.customer_name).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="font-medium text-sm text-gray-800">
                    {r.user_name || r.customer_name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {visibleCount < reviews.length && (
            <div className="text-center mt-2 mb-12">
              <button
                onClick={loadMore}
                className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
              >
                Load more reviews
              </button>
            </div>
          )}

          {galleryReviews.length > 0 && (
            <>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Customer Gallery</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryReviews.map((r: any) => (
                  <div key={r.id} className="relative aspect-square rounded-2xl overflow-hidden group">
                    <Image
                      src={r.image_url}
                      alt={r.user_name || r.customer_name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
