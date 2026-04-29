'use client'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

export default function InfluencerPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">

        <section className="py-20 text-center bg-white">
          <h1 className="text-4xl font-bold text-[#111111]">
            Influencer Program
          </h1>
          <p className="text-gray-600 mt-3 max-w-xl mx-auto">
            Join our creator network and promote SpectrumCosmo products.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-12 space-y-8">

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg mb-2">Benefits</h2>
            <ul className="text-gray-600 list-disc pl-5 space-y-1">
              <li>Free or discounted products</li>
              <li>Paid campaigns (selected creators)</li>
              <li>Affiliate earnings</li>
              <li>Early access to drops</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg mb-2">Requirements</h2>
            <ul className="text-gray-600 list-disc pl-5 space-y-1">
              <li>Active social media presence</li>
              <li>Consistent content creation</li>
              <li>Engagement with audience</li>
              <li>Brand alignment</li>
            </ul>
          </div>

        </section>
      </main>

      <Footer />
    </>
  )
}
