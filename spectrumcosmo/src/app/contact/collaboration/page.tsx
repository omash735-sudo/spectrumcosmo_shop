'use client'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

export default function CollaborationPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">

        <section className="py-20 text-center bg-white">
          <h1 className="text-4xl font-bold text-[#111111]">
            Collaboration
          </h1>
          <p className="text-gray-600 mt-3 max-w-xl mx-auto">
            Partner with SpectrumCosmo and showcase your brand on our platform.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg mb-2">Overview</h2>
            <p className="text-gray-600">
              We work with creators, brands, and entrepreneurs who want to grow through product exposure and creative partnerships.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg mb-2">What we offer</h2>
            <ul className="text-gray-600 list-disc pl-5 space-y-1">
              <li>Product listings on our store</li>
              <li>Brand visibility across platform</li>
              <li>Custom promotional campaigns</li>
              <li>Long-term partnerships</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg mb-2">Requirements</h2>
            <ul className="text-gray-600 list-disc pl-5 space-y-1">
              <li>Product/service details</li>
              <li>Budget or pricing range</li>
              <li>Product images (optional)</li>
              <li>Business links</li>
            </ul>
          </div>

        </section>
      </main>

      <Footer />
    </>
  )
}
