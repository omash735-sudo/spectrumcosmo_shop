'use client'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

export default function BusinessPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">

        <section className="py-20 text-center bg-white">
          <h1 className="text-4xl font-bold text-[#111111]">
            Business Partnerships
          </h1>
          <p className="text-gray-600 mt-3 max-w-xl mx-auto">
            Let’s build long-term business relationships with SpectrumCosmo.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg mb-2">Partnership Types</h2>
            <ul className="text-gray-600 list-disc pl-5 space-y-1">
              <li>Product supply partnerships</li>
              <li>Bulk distribution agreements</li>
              <li>Brand collaborations</li>
              <li>Retail integration</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg mb-2">What to include</h2>
            <ul className="text-gray-600 list-disc pl-5 space-y-1">
              <li>Company name</li>
              <li>Product/service details</li>
              <li>Pricing structure</li>
              <li>Partnership model</li>
            </ul>
          </div>

        </section>
      </main>

      <Footer />
    </>
  )
}
