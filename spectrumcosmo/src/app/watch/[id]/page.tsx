'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useParams } from 'next/navigation'

export default function WatchPage() {
  const params = useParams()
  const id = params.id

  const [anime, setAnime] = useState<any>(null)

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`)
        const data = await res.json()
        setAnime(data.data)
      } catch {
        console.error('Failed to fetch anime')
      }
    }

    if (id) fetchAnime()
  }, [id])

  return (
    <>
      <Navbar />

      <main className="bg-white min-h-screen py-16 px-4">
        <div className="max-w-5xl mx-auto">

          {!anime && <p className="text-center">Loading...</p>}

          {anime && (
            <>
              {/* Trailer */}
              <div className="aspect-video rounded-2xl overflow-hidden shadow mb-8">
                {anime.trailer?.embed_url ? (
                  <iframe
                    src={anime.trailer.embed_url}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={anime.images?.jpg?.large_image_url}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <h1 className="text-3xl font-bold mb-4">
                {anime.title}
              </h1>

              <p className="text-gray-500 mb-4">
                {anime.synopsis}
              </p>

              <p className="text-sm text-gray-400 mb-6">
                ⭐ Score: {anime.score || 'N/A'}
              </p>

              {/* CTA */}
              <a
                href="https://anikai.to/"
                target="_blank"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full transition"
              >
                Watch Full Anime →
              </a>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
