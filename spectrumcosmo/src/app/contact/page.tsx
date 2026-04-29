'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

const images = [
  "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470830/zenitsu-agatsuma-3840x2160-24356_g79imh.jpg",
  "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470912/chisa-wuthering-5120x2880-24840_flwmaf.jpg",
  "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470897/japan-artistic-5120x2880-25406_yboawj.jpg",
  "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470879/ash-ketchum-pikachu-3840x2160-17918_v8h1cr.jpg",
  "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470821/mirei-tsukino-anya-6400x3597-24381_ttcolj.jpg",
  "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470790/skirk-blue-3840x2160-22953_cdfqqa.jpg",
  "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470818/jungle-tree-dark-3840x2160-22695_ehccrb.jpg"
]

export default function ContactPage() {
  const [index, setIndex] = useState(0)
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: ''
  })

  useEffect(() => {
    // preload images (removes black flash)
    images.forEach((src) => {
      const img = new Image()
      img.src = src
    })

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'general',
        name: form.name,
        email: form.email,
        message: form.message
      })
    })

    alert('Message sent successfully')
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black">

        {/* HERO WITH CROSS FADE (NO BLACK FLASH) */}
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">

          {/* BACKGROUND LAYER 1 */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${images[index]})`,
              opacity: 1
            }}
          />

          {/* DARK OVERLAY */}
          <div className="absolute inset-0 bg-black/60" />

          {/* TEXT */}
          <div className="relative z-10 text-white text-center px-4">
            <h1 className="text-4xl font-bold">
              Contact SpectrumCosmo
            </h1>
            <p className="text-gray-200 mt-3">
              Reach out, collaborate, or get support
            </p>
          </div>

        </section>

        {/* HUB BUTTONS */}
        <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-6">

          <Link href="/contact/collaboration" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            Collaboration
          </Link>

          <Link href="/contact/support" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            Support
          </Link>

          <Link href="/contact/influencer" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            Influencer
          </Link>

          <Link href="/contact/business" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            Business
          </Link>

        </section>

        {/* CONTACT FORM (RESTORED) */}
        <section className="max-w-3xl mx-auto px-4 pb-20">

          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">

            <h2 className="text-xl font-semibold">Send us a message</h2>

            <input
              className="w-full border p-3 rounded"
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full border p-3 rounded"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <textarea
              className="w-full border p-3 rounded"
              rows={5}
              placeholder="Message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />

            <button className="w-full bg-[#F97316] text-white py-3 rounded">
              Send Message
            </button>

          </form>

        </section>

      </main>

      <Footer />
    </>
  )
}
