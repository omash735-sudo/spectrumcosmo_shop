'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([])

  useEffect(() => {
    const loadNews = async () => {
      try {
        const res = await fetch('/api/anime/news')
        const data = await res.json()
        setNews(data.data || [])
      } catch {
        setNews([])
      }
    }

    loadNews()
  }, [])

  return (
    <>
      <Navbar />

      <main className="bg-white min-h-screen py-16 px-4">
        <div className="max-w-6xl mx-auto">

          <h1 className="text-3xl font-bold mb-10">
            Anime News
          </h1>

          <div className="grid md:grid-cols-3 gap-6">
            {news.length === 0 && (
              <p className="text-gray-500">Loading news...</p>
            )}

            {news.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition overflow-hidden"
              >
                <img
                  src={item.image || '/images/placeholder.jpg'}
                  className="h-48 w-full object-cover group-hover:scale-105 transition duration-300"
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

        </div>
      </main>

      <Footer />
    </>
  )
}
