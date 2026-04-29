'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
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

    console.log('Contact Form:', form)

    alert(
      `Thanks ${form.fullName}! We’ll respond within 24–48 hours.`
    )

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

        {/* HEADER */}
        <section className="py-20 text-center bg-orange-50">
          <h1 className="text-4xl font-bold text-[#111111] mb-4">
            Contact Us
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Need help, custom orders, or collaboration? We usually reply within 24–48 hours.
          </p>
        </section>

        {/* CONTACT SECTION */}
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

                {/* Name */}
                <div>
                  <label className="text-sm text-gray-700">
                    Full Name *
                  </label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full mt-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                    placeholder="Your name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm text-gray-700">
                    Email *
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full mt-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm text-gray-700">
                    Contact Number *
                  </label>
                  <input
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={handleChange}
                    className="w-full mt-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                    placeholder="Your phone number"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-sm text-gray-700">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full mt-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                    placeholder="How can we help you?"
                  />
                </div>

                {/* Button */}
                <button
                  type="submit"
                  className="w-full bg-[#F97316] text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition"
                >
                  Send Message
                </button>

              </form>
            </div>
          </div>
        </section>

        {/* SUPPORT INFO */}
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
