'use client'

import { useState } from 'react'
import {
  MessageCircle,
  Mail,
  HelpCircle,
  Phone,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

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
    const phone = '265893160202'
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
    <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-5 sm:py-6 md:py-10 space-y-5 sm:space-y-6">

      {/* HEADER */}
      <div>
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
          <div className="w-1 h-5 sm:h-6 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Customer Support</h1>
          <Sparkles size={14} className="text-orange-400 sm:w-[18px] sm:h-[18px]" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
          We're here to help you anytime
        </p>
      </div>

      {/* SUPPORT OPTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">

        {/* LIVE CHAT */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center">
              <MessageCircle size={16} className="text-green-600 dark:text-green-400 sm:w-[18px] sm:h-[18px]" />
            </div>
            <h2 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">Live Chat</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
            Talk to us instantly on WhatsApp
          </p>
          <button
            onClick={openWhatsApp}
            className="w-full mt-3 sm:mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 sm:py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm"
          >
            Start Chat
          </button>
        </div>

        {/* EMAIL */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-950/30 rounded-full flex items-center justify-center">
              <Mail size={16} className="text-blue-600 dark:text-blue-400 sm:w-[18px] sm:h-[18px]" />
            </div>
            <h2 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">Email Support</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
            Response within 24 hours
          </p>
          <button
            onClick={sendEmail}
            className="w-full mt-3 sm:mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 sm:py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm"
          >
            Send Email
          </button>
        </div>

        {/* CALL */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-950/30 rounded-full flex items-center justify-center">
              <Phone size={16} className="text-purple-600 dark:text-purple-400 sm:w-[18px] sm:h-[18px]" />
            </div>
            <h2 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">Call Us</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
            Instant phone support
          </p>
          <a
            href="tel:+265893160202"
            className="flex items-center justify-center gap-2 w-full mt-3 sm:mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-2 sm:py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm"
          >
            <Phone size={14} />
            Call Now
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-950/30 rounded-full flex items-center justify-center">
            <HelpCircle size={16} className="text-orange-600 dark:text-orange-400 sm:w-[18px] sm:h-[18px]" />
          </div>
          <h2 className="font-semibold text-gray-800 dark:text-white text-base sm:text-lg">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="border border-gray-100 dark:border-gray-700 rounded-lg sm:rounded-xl overflow-hidden"
            >
              <button
                className="w-full p-3 sm:p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              >
                <span className="font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
                  {f.q}
                </span>
                {openFAQ === i ? (
                  <ChevronUp size={16} className="text-orange-500 flex-shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openFAQ === i && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                    {f.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Still Need Help Section */}
      <div className="bg-gradient-to-r from-orange-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-center border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base mb-1 sm:mb-2">Still need help?</h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">Can't find what you're looking for? Contact our support team.</p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          <button
            onClick={openWhatsApp}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-600 transition shadow-sm"
          >
            <MessageCircle size={14} />
            WhatsApp Us
          </button>
          <button
            onClick={sendEmail}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Mail size={14} />
            Email Us
          </button>
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <HelpCircle size={14} />
            View All FAQs
          </Link>
        </div>
      </div>

      {/* FOOT NOTE */}
      <div className="text-center text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
        SpectrumCosmo Support • We respond fast
      </div>
    </div>
  )
}
