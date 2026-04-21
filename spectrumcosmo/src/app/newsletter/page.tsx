'use client'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useEffect, useState } from 'react'

export default function NewsletterPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const [animeFeed, setAnimeFeed] = useState<any[]>([])
  const [visibleAnime, setVisibleAnime] = useState<any[]>([])
  const [animeNews, setAnimeNews] = useState<any[]>([])

  const products = [
    {
      id: 1,
      name: 'Akatsuki Hoodie',
      price: 'MK 75,000',
      image: '/images/akatsuki.jpg',
      status: 'available',
      link: '/product/akatsuki-hoodie',
    },
    {
      id: 2,
      name: 'Naruto Pendant',
      price: 'MK 8,000',
      image: '/images/pendant.jpg',
      status: 'preorder',
      link: '/preorder/naruto-pendant',
    },
    {
      id: 3,
      name: 'Anime Jacket',
      price: 'MK 60,000',
      image: '/images/jacket.jpg',
      status: 'coming_soon',
      link: '/coming-soon/anime-jacket',
    },
  ]

  useEffect(() => {
    const loadAnime = async () => {
      try {
        const res = await fetch('https://api.jikan.moe/v4/top/anime')
        const data = await res.json()
        setAnimeFeed(data.data || [])
      } catch {
        setAnimeFeed([])
      }
    }

    loadAnime()
  }, [])

  useEffect(() => {
    if (!animeFeed.length) return

    const update = () => {
      const sorted = [...animeFeed].sort(
        (a, b) => (b.popularity || 0) - (a.popularity || 0)
      )

      setVisibleAnime(sorted.slice(0, 10))
    }

    update()

    const interval = setInterval(() => {
      update()
    }, 12000)

    return () => clearInterval(interval)
  }, [animeFeed])

  useEffect(() => {
    const loadNews = async () => {
      try {
        const res = await fetch('/api/anime/news')
        const data = await res.json()
        setAnimeNews(data.data || [])
      } catch {
        setAnimeNews([])
      }
    }

    loadNews()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')

    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Newsletter Subscription',
          content: 'User subscribed',
          audience: 'all',
          status: 'sent',
          auto_send: true,
        }),
      })

      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }

    setLoading(false)
  }

  const handleProductRoute = (item: any) => {
    if (item.status === 'available') {
      window.location.href = item.link
    } else {
      window.location.href = item.link
    }
  }

  return (
    <>
      <Navbar />

      <main className="bg-white min-h-screen py-20">
        <div className="max-w-6xl mx-auto px-4">

          <section className="grid md:grid-cols-2 gap-10 items-center mb-20">

            <div>
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                Discover Anime Worlds
              </h1>

              <p className="text-gray-500 mb-6">
                Drops, news, and trending anime in one place.
              </p>

              <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="px-6 py-3 border rounded-full w-72"
                />

                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full transition">
                  {loading ? 'Loading' : 'Subscribe'}
                </button>
              </form>

              {status === 'success' && (
                <p className="text-green-600 mt-3">Subscribed successfully</p>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {visibleAnime.slice(0, 10).map((anime, i) => (
                <a
                  key={i}
                  href={`/watch/${anime.mal_id}`}
                  className="relative h-28 rounded-xl overflow-hidden group"
                >
                  <img
                    src={anime.images?.jpg?.large_image_url}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />

                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/60 transition" />

                  <div className="absolute bottom-1 left-2 text-white text-xs opacity-0 group-hover:opacity-100 transition">
                    {anime.title}
                  </div>
                </a>
              ))}
            </div>

          </section>

          <section className="mb-20">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">New Drops</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {products.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleProductRoute(item)}
                  className="cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition"
                >
                  <img
                    src={item.image}
                    className="h-56 w-full object-cover hover:scale-105 transition duration-300"
                  />

                  <div className="p-4">
                    <p className="text-xs text-orange-500 uppercase">
                      {item.status.replace('_', ' ')}
                    </p>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-orange-500 font-bold">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-20">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">Anime News</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {animeNews.slice(0, 3).map((item, i) => (
                <a
                  key={i}
                  href={item.link || '#'}
                  target="_blank"
                  className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer"
                >
                  <img
                    src={item.image || '/images/placeholder.jpg'}
                    className="h-48 w-full object-cover hover:scale-105 transition"
                  />

                  <div className="p-4">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-2">{item.date}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Watch Now</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {visibleAnime.slice(0, 4).map((anime, i) => (
                <a
                  key={i}
                  href={`/watch/${anime.mal_id}`}
                  className="relative rounded-2xl overflow-hidden group bg-black"
                >
                  <img
                    src={anime.images?.jpg?.large_image_url}
                    className="w-full h-full object-cover group-hover:scale-110 transition"
                  />

                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition" />

                  <div className="absolute bottom-0 p-4 text-white">
                    <p className="font-semibold">{anime.title}</p>
                    <p className="text-sm text-orange-400">Watch now</p>
                  </div>
                </a>
              ))}
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </>
  )
}
