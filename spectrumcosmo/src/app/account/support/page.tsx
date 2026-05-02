'use client'

import { useState } from 'react'
import {
  MessageCircle,
  Mail,
  HelpCircle,
  Phone,
} from 'lucide-react'

const faqs = [
  {
    q: 'How do I return an item?',
    a: 'You can return items within 7 days by contacting support with your order ID.',
  },
  {
    q: 'When will my order arrive?',
    a: 'Delivery usually takes 2–5 business days depending on your location.',
  },
  {
    q: 'Can I change my payment method?',
    a: 'Yes, go to Settings → Payments to update your payment method.',
  },
  {
    q: 'Can I cancel an order?',
    a: 'Orders can be cancelled before they are shipped.',
  },
]

export default function SupportPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  const openWhatsApp = () => {
    const phone = '265893160202' // your support number
    const message = encodeURIComponent(
      'Hello SpectrumCosmo support, I need help with my order.'
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const sendEmail = () => {
    const subject = encodeURIComponent('SpectrumCosmo Support Request')
    const body = encodeURIComponent(
      'Hello Support Team,\n\nI need help with:\n'
    )
    window.location.href = `mailto:support@spectrumcosmo.com?subject=${subject}&body=${body}`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Customer Support</h1>
        <p className="text-sm text-gray-500">
          We’re here to help you anytime
        </p>
      </div>

      {/* SUPPORT OPTIONS */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* LIVE CHAT */}
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageCircle size={18} /> Live Chat
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Talk to us instantly on WhatsApp
          </p>

          <button
            onClick={openWhatsApp}
            className="btn-primary w-full mt-4"
          >
            Start Chat
          </button>
        </div>

        {/* EMAIL */}
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-semibold flex items-center gap-2">
            <Mail size={18} /> Email Support
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Response within 24 hours
          </p>

          <button
            onClick={sendEmail}
            className="btn-secondary w-full mt-4"
          >
            Send Email
          </button>
        </div>

        {/* CALL */}
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-semibold flex items-center gap-2">
            <Phone size={18} /> Call Us
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            Instant phone support
          </p>

          <a
            href="tel:+265893160202"
            className="btn-ghost w-full mt-4 justify-center"
          >
            Call Now
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border rounded-2xl p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <HelpCircle size={18} /> Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="border rounded-lg p-3 cursor-pointer"
              onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
            >
              <p className="font-medium text-sm">{f.q}</p>

              {openFAQ === i && (
                <p className="text-sm text-gray-600 mt-2">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FOOT NOTE */}
      <div className="text-center text-sm text-gray-400">
        SpectrumCosmo Support • We respond fast ⚡
      </div>
    </div>
  )
}
