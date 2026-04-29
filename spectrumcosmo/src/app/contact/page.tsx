'use client'

import { useState, ChangeEvent, FormEvent, useEffect } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

interface ContactFormData {
  fullName: string
  email: string
  contactNumber: string
  message: string
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormData>({
    fullName: '',
    email: '',
    contactNumber: '',
    message: ''
  })

  // ===== ANIME BACKGROUND SYSTEM (10 IMAGES) =====
  const backgrounds = [
    'https://images.unsplash.com/photo-1526481280695-3c687fd5432c',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
    'https://images.unsplash.com/photo-1516900557549-41557d405adf',
    'https://images.unsplash.com/photo-1526481280695-3c687fd5432c',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
    'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e'
  ]

  const [bgIndex, setBgIndex] = useState(0)
  const [offsetY, setOffsetY] = useState(0)

  // ===== ROTATION (5 seconds) =====
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // ===== PARALLAX EFFECT =====
  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY * 0.3)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (
      !form.fullName ||
      !form.email ||
      !form.contactNumber ||
      !form.message
    ) {
      alert('Please fill in all fields.')
      return
    }

    if (!form.email.includes('@')) {
      alert('Please enter a valid email.')
      return
    }

    alert(`Thanks ${form.fullName}! We’ll respond within 24–48 hours.`)

    setForm({
      fullName: '',
      email: '',
      contactNumber: '',
      message: ''
    })
  }

  return (
    <>
      <Navbar />

      <main className="bg-gray-50 min-h-screen">

        {/* ===== HERO (ANIME + PARALLAX) ===== */}
        <section className="relative h-[420px] overflow-hidden flex items-center justify-center text-white">

          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
            style={{
              backgroundImage: `url(${backgrounds[bgIndex]})`,
              transform: `translateY(${offsetY}px) scale(1.1)`
            }}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/55" />

          {/* Content */}
          <div className="relative text-center px-4">
            <h1 className="text-4xl font-bold mb-4">
              Contact Us
            </h1>
            <p className="text-gray-200 max-w-xl mx-auto">
              Need help, custom orders, or collaboration? We usually reply within 24–48 hours.
            </p>
          </div>

        </section>

        {/* ===== CONTACT FORM ===== */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4">

            <div className="bg-white rounded-2xl shadow-lg p-8">

              <h2 className="text-xl font-semibold mb-2 text-[#111111]">
                Send us a message
              </h2>

              <p className="text-gray-500 text-sm mb-8">
                We’ll get back to you as soon as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">

                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Full Name"
                />

                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Email"
                />

                <input
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Contact Number"
                />

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Message"
                />

                <button
                  type="submit"
                  className="w-full bg-[#F97316] text-white py-3 rounded-lg"
                >
                  Send Message
                </button>

              </form>
            </div>
          </div>
        </section>

        {/* ===== INFO CARDS ===== */}
        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-3 gap-6 text-center">

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="font-bold text-[#F97316]">Fast Response</p>
              <p className="text-sm text-gray-500 mt-1">24–48 hours reply time</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="font-bold text-[#F97316]">Support</p>
              <p className="text-sm text-gray-500 mt-1">Orders, custom designs & help</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="font-bold text-[#F97316]">Collaboration</p>
              <p className="text-sm text-gray-500 mt-1">Business & influencer deals</p>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
