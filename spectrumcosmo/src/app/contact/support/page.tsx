'use client'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

export default function SupportPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">

        <section className="py-20 text-center bg-white">
          <h1 className="text-4xl font-bold text-[#111111]">
            Support Center
          </h1>
          <p className="text-gray-600 mt-3 max-w-xl mx-auto">
            We’re here to help with orders, payments, and general inquiries.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg mb-2">Help Topics</h2>
            <ul className="text-gray-600 list-disc pl-5 space-y-1">
              <li>Order tracking</li>
              <li>Payment issues</li>
              <li>Delivery concerns</li>
              <li>Account access</li>
              <li>Product questions</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg mb-2">Response Time</h2>
            <p className="text-gray-600">
              Most support requests are handled within 24–48 hours.
            </p>
          </div>

        </section>
      </main>

      <Footer />
    </>
  )
}
