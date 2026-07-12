'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import StarRating from '../ui/StarRating'
import { Star } from 'lucide-react'

export default function LiveReviews({ initialReviews }: { initialReviews: any[] }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [visibleCount, setVisibleCount] = useState(12)

  useEffect(() => {
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

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--background-card)] rounded-2xl border border-[var(--border)]">
        <Star size={48} className="text-[var(--foreground-muted)] mx-auto mb-4" />
        <p className="text-[var(--foreground-muted)]">No reviews yet. Be the first!</p>
        <a href="/reviews/submit" className="inline-block mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium transition">
          Write a Review →
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {visibleReviews.map((r: any) => (
          <div key={r.id} className="bg-[var(--background-card)] rounded-2xl p-6 shadow-sm border border-[var(--border)] hover:shadow-md transition">
            <StarRating rating={r.rating} />
            <p className="text-[var(--foreground)] text-sm leading-relaxed mt-4 mb-5 line-clamp-4">
              "{r.review_text}"
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
              {r.user_image ? (
                <Image src={r.user_image} alt={r.user_name || r.customer_name} width={40} height={40} className="rounded-full object-cover w-10 h-10" />
              ) : r.image_url ? (
                <Image src={r.image_url} alt={r.user_name || r.customer_name} width={40} height={40} className="rounded-full object-cover w-10 h-10" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-[var(--primary)]">
                    {(r.user_name || r.customer_name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-medium text-sm text-[var(--foreground)]">
                {r.user_name || r.customer_name || 'Anonymous'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {visibleCount < reviews.length && (
        <div className="text-center mt-2 mb-12">
          <button
            onClick={loadMore}
            className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full font-medium transition shadow-sm"
          >
            Load More Reviews
          </button>
        </div>
      )}

      {galleryReviews.length > 0 && (
        <>
          <div className="manga-bg cards-manga rounded-xl overflow-hidden mb-6">
            <div className="relative z-10 px-6 py-4 bg-[var(--background-card)]/95">
              <h3 className="text-2xl font-bold text-[var(--foreground)] text-center">Customer Gallery</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {galleryReviews.map((r: any) => (
              <div key={r.id} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer">
                <Image
                  src={r.image_url}
                  alt={r.user_name || r.customer_name || 'Customer'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
