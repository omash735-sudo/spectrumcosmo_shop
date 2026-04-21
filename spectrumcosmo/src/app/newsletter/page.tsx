'use client'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useEffect, useState } from 'react'

export default function NewsletterPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [animeNews, setAnimeNews] = useState<any[]>([])
  const [trendingAnime, setTrendingAnime] = useState<any[]>([])

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

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const res = await fetch('https://api.jikan.moe/v4/top/anime')
        const data = await res.json()

        const filtered = data.data
          .filter((anime: any) => anime.trailer?.embed_url)
          .slice(0, 4)

        setTrendingAnime(filtered)
      } catch {
        console.log('Failed to load trending anime')
      }
    }

    loadTrending()
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
          content: 'User subscribed from newsletter page',
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

  const products = [
    {
      name: 'Akatsuki Hoodie',
      price: 'MK 75,000',
      image: '/images/akatsuki.jpg',
      link: '/product/akatsuki-hoodie',
    },
    {
      name: 'Naruto Pendant',
      price: 'MK 8,000',
      image: '/images/pendant.jpg',
      link: '/product/naruto-pendant',
    },
  ]

  return (
    <>
      <Navbar />

      <main className="bg-white min-h-screen py-20">
        <div className="max-w-6xl mx-auto px-4">

          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">
              Discover Anime Worlds
            </h1>

            <p className="text-gray-500 mb-6">
              Drops, news and trending anime in one place.
            </p>

            <form onSubmit={handleSubmit} className="flex justify-center gap-3 flex-wrap">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="px-6 py-3 border rounded-full w-72"
              />

              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full transition">
                {loading ? '...' : 'Subscribe'}
              </button>
            </form>

            {status === 'success' && (
              <p className="text-green-600 mt-3">Subscribed</p>
            )}
          </div>

          {/* Products */}
          <section className="mb-20">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">New Drops</h2>
              <a href="/shop" className="text-orange-500 hover:underline">
                View all
              </a>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {products.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  className="group rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition overflow-hidden"
                >
                  <img
                    src={item.image}
                    className="h-56 w-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  <div className="p-4">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-orange-500 font-bold">{item.price}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* News */}
          <section className="mb-20">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">Anime News</h2>
              <a href="/news" className="text-orange-500 hover:underline">
                See more
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {animeNews.slice(0, 3).map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  className="group rounded-2xl shadow-sm hover:shadow-lg overflow-hidden transition"
                >
                  <img
                    src={item.image || '/images/placeholder.jpg'}
                    className="h-48 w-full object-cover group-hover:scale-105 transition"
                  />

                  <div className="p-4">
                    <p className="font-semibold group-hover:underline">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {item.date}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Watch Now */}
          <section className="mb-20">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">Watch Now</h2>
              <a href="/watch" className="text-orange-500 hover:underline">
                View all
              </a>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {trendingAnime.map((anime, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl overflow-hidden bg-black shadow-sm hover:shadow-lg transition"
                >
                  <img
                    src={anime.images?.jpg?.large_image_url}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />

                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition" />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition">
                      ▶
                    </div>
                  </div>

                  <div className="absolute bottom-0 p-4 text-white">
                    <p className="font-semibold">{anime.title}</p>
                    <a
                      href={`/watch/${anime.mal_id}`}
                      className="text-orange-400 text-sm hover:underline"
                    >
                      Watch now
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </>
  )
      }
