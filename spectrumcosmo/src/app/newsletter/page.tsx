'use client'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useState } from 'react'

export default function NewsletterPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')

    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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

          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold text-[#111111] mb-3">
              Stay Connected
            </h1>
            <p className="text-gray-500">
              Get new drops, anime updates, and exclusive content.
            </p>
          </div>

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
              className="bg-[#F97316] text-white px-8 py-4 rounded-full font-medium hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          {status === 'success' && (
            <p className="text-green-600 text-center mb-10">
              Successfully subscribed.
            </p>
          )}

          {status === 'error' && (
            <p className="text-red-500 text-center mb-10">
              Something went wrong.
            </p>
          )}

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-2">New Drops</h2>
            <p className="text-gray-500">Latest anime-inspired merch updates.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-2">Anime News</h2>
            <p className="text-gray-500">Trending anime updates and releases.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-2">Watch Anime</h2>
            <a
              href="https://anikai.to/"
              target="_blank"
              className="border px-6 py-3 rounded-full hover:bg-gray-100 inline-block"
            >
              Watch Now
            </a>
          </section>

        </div>
      </main>

      <Footer />
    </>
  )
}
