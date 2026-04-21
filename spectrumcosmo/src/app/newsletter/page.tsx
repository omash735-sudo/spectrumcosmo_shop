'use client'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useEffect, useState } from 'react'

export default function NewsletterPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [animeNews, setAnimeNews] = useState<any[]>([])

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

  return (
    <>
      <Navbar />

      <main className="bg-white min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold text-[#111111] mb-3">
              Stay Connected
            </h1>
            <p className="text-gray-500">
              Get updates on new drops, anime news, and exclusive content.
            </p>
          </div>

          {/* Subscribe */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-10">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-4 border border-gray-200 rounded-full focus:outline-none"
            />

            <button
              disabled={loading}
              className="bg-[#F97316] text-white px-8 py-4 rounded-full font-medium disabled:opacity-60"
            >
              {loading ? 'Loading...' : 'Subscribe'}
            </button>
          </form>

          {status === 'success' && (
            <p className="text-green-600 text-center mb-8">
              Successfully subscribed.
            </p>
          )}

          {status === 'error' && (
            <p className="text-red-500 text-center mb-8">
              Something went wrong.
            </p>
          )}

          {/* New Drops */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-3">New Drops</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border rounded-xl p-4">
                <p className="font-semibold">Akatsuki Hoodie</p>
                <p className="text-sm text-gray-500">
                  Latest anime-inspired release
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <p className="font-semibold">Naruto Pendant</p>
                <p className="text-sm text-gray-500">
                  Limited edition drop
                </p>
              </div>
            </div>
          </section>

          {/* Anime News */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-3">Anime News</h2>

            <div className="space-y-3">
              {animeNews.length === 0 && (
                <p className="text-gray-500">Loading news...</p>
              )}

              {animeNews.map((item, i) => (
                <div key={i} className="border rounded-xl p-4">
                  {item.type === 'trending' ? (
                    <>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-gray-500">
                        Trending Score: {item.score}
                      </p>
                    </>
                  ) : (
                    <>
                      <a
                        href={item.link}
                        target="_blank"
                        className="font-semibold hover:underline"
                      >
                        {item.title}
                      </a>
                      <p className="text-sm text-gray-500">
                        {item.date}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Watch Anime */}
          <section>
            <h2 className="text-2xl font-bold mb-3">Watch Anime</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border rounded-xl p-4">
                <p className="font-semibold mb-2">Streaming Hub</p>
                <p className="text-sm text-gray-500 mb-3">
                  Explore anime streaming platforms.
                </p>

                <a
                  href="https://anikai.to/"
                  target="_blank"
                  className="border px-6 py-3 rounded-full inline-block"
                >
                  Open Site
                </a>
              </div>

              <div className="border rounded-xl p-4 bg-black text-white">
                <p className="text-sm opacity-70">Preview</p>
                <p className="mt-2 font-semibold">
                  Anime Experience
                </p>
                <p className="text-xs opacity-60 mt-2">
                  Click to explore
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </>
  )
}
