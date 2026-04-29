'use client'

import { useState, ChangeEvent, FormEvent, useEffect } from 'react'
import Link from 'next/link'

interface ContactFormData {
  fullName: string
  email: string
  contactNumber: string
  message: string
}

const images = [
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470830/zenitsu-agatsuma-3840x2160-24356_g79imh.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470912/chisa-wuthering-5120x2880-24840_flwmaf.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470897/japan-artistic-5120x2880-25406_yboawj.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470879/ash-ketchum-pikachu-3840x2160-17918_v8h1cr.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470821/mirei-tsukino-anya-6400x3597-24381_ttcolj.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470790/skirk-blue-3840x2160-22953_cdfqqa.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470818/jungle-tree-dark-3840x2160-22695_ehccrb.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470830/zenitsu-agatsuma-3840x2160-24356_g79imh.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470912/chisa-wuthering-5120x2880-24840_flwmaf.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777470897/japan-artistic-5120x2880-25406_yboawj.jpg'
]

export default function ContactPage() {
  const [index, setIndex] = useState(0)

  const [form, setForm] = useState<ContactFormData>({
    fullName: '',
    email: '',
    contactNumber: '',
    message: ''
  })

  // HERO SLIDER (10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!form.fullName || !form.email || !form.contactNumber || !form.message) {
      alert('Please fill all fields')
      return
    }

    console.log('Contact form:', form)

    alert(`Thanks ${form.fullName}, we will get back to you soon.`)

    setForm({
      fullName: '',
      email: '',
      contactNumber: '',
      message: ''
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO */}
      <div className="relative h-[420px] w-full overflow-hidden">
        <img
          src={images[index]}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        />

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h1 className="text-white text-4xl font-bold">
            Contact Us
          </h1>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* CONTACT FORM (PRIMARY) */}
        <div className="bg-white rounded-xl shadow p-6 mb-10">

          <h2 className="text-xl font-semibold mb-1">
            Send us a message
          </h2>

          <p className="text-sm text-gray-500 mb-6">
            We usually respond within 24–48 hours
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full border p-3 rounded"
            />

            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full border p-3 rounded"
            />

            <input
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full border p-3 rounded"
            />

            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Your message"
              rows={4}
              className="w-full border p-3 rounded"
            />

            <button className="w-full bg-orange-500 text-white py-3 rounded">
              Submit
            </button>

          </form>
        </div>

        {/* FEATURE GRID (SECONDARY NAVIGATION) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">

          <Link href="/contact/collaboration" className="bg-white p-5 rounded-xl shadow hover:shadow-md">
            <h3 className="font-semibold">Collaboration</h3>
            <p className="text-sm text-gray-500">Work with SpectrumCosmo</p>
          </Link>

          <Link href="/contact/support" className="bg-white p-5 rounded-xl shadow hover:shadow-md">
            <h3 className="font-semibold">Support</h3>
            <p className="text-sm text-gray-500">Get help & assistance</p>
          </Link>

          <Link href="/contact/influencer" className="bg-white p-5 rounded-xl shadow hover:shadow-md">
            <h3 className="font-semibold">Influencer</h3>
            <p className="text-sm text-gray-500">Partner with us</p>
          </Link>

          <Link href="/contact/business" className="bg-white p-5 rounded-xl shadow hover:shadow-md">
            <h3 className="font-semibold">Business</h3>
            <p className="text-sm text-gray-500">Bulk & enterprise deals</p>
          </Link>

        </div>

        {/* FOOT NOTE */}
        <div className="text-center text-sm text-gray-500">
          SpectrumCosmo Contact System
        </div>

      </div>
    </div>
  )
}
