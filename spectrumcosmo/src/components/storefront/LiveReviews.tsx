'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import StarRating from '../ui/StarRating'

export default function LiveReviews({ initialReviews }: { initialReviews: any[] }) {
  const [reviews, setReviews] = useState(initialReviews)

  useEffect(() => {
    let mounted = true
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/reviews')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setReviews(data.slice(0, 8))
        }
      } catch (err) {
        // silently fail
      }
    }

    const interval = setInterval(fetchLatest, 3000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const galleryReviews = reviews.filter((r: any) => r.image_url)

  return (
    <>
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><p>No reviews yet. Be the first!</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {reviews.slice(0,6).map((r: any) => (
            <div key={r.id} className="card p-6">
              <StarRating rating={r.rating} />
              <p className="text-gray-700 text-sm leading-relaxed mt-4 mb-5 line-clamp-4">"{r.review_text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                {r.image_url && <Image src={r.image_url} alt={r.customer_name} width={40} height={40} className="rounded-full object-cover w-10 h-10" />}
                <span className="font-medium text-sm text-[#111111]">{r.customer_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {galleryReviews.length > 0 && (
        <>
          <h3 className="text-2xl font-bold text-[#111111] mb-6 text-center">Customer Gallery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {galleryReviews.map((r: any) => (
              <div key={r.id} className="relative aspect-square rounded-2xl overflow-hidden group">
                <Image src={r.image_url} alt={r.customer_name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
