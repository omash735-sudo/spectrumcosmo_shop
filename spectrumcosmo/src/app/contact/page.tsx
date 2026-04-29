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

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black">

        {/* HERO (ANIME PARALLAX STYLE) */}
        <section className="relative h-[60vh] flex items-center justify-center text-center overflow-hidden">

          {/* BACKGROUND IMAGE */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
            style={{
              backgroundImage: `url(${images[index]})`,
              transform: 'scale(1.05)'
            }}
          />

          {/* DARK OVERLAY */}
          <div className="absolute inset-0 bg-black/60" />

          {/* TEXT */}
          <div className="relative z-10 text-white px-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Contact SpectrumCosmo
            </h1>
            <p className="mt-3 text-gray-200 max-w-xl mx-auto">
              Collaborate, apply, or get support — everything starts here.
            </p>
          </div>

        </section>

        {/* OPTIONS */}
        <section className="max-w-6xl mx-auto px-4 py-14 grid md:grid-cols-2 gap-6">

          <Link href="/contact/collaboration" className="bg-white rounded-xl p-6 shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold">Collaboration</h2>
            <p className="text-gray-600 mt-2">
              Work with us to feature your products or brand.
            </p>
          </Link>

          <Link href="/contact/influencer" className="bg-white rounded-xl p-6 shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold">Influencer Program</h2>
            <p className="text-gray-600 mt-2">
              Apply to promote SpectrumCosmo and earn rewards.
            </p>
          </Link>

          <Link href="/contact/support" className="bg-white rounded-xl p-6 shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold">Support</h2>
            <p className="text-gray-600 mt-2">
              Get help with orders, payments, and account issues.
            </p>
          </Link>

          <Link href="/contact/business" className="bg-white rounded-xl p-6 shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold">Business</h2>
            <p className="text-gray-600 mt-2">
              Long-term partnerships and wholesale deals.
            </p>
          </Link>

        </section>

      </main>

      <Footer />
    </>
  )
}
