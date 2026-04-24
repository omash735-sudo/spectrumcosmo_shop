export const dynamic = 'force-dynamic'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import LiveReviews from '@/components/storefront/LiveReviews'
import { getDb } from '@/lib/db'

export default async function ReviewsPage() {
  let reviews: any[] = []

  try {
    const sql = getDb()

    reviews = await sql`
      SELECT * FROM reviews
      WHERE approved = true
      ORDER BY created_at DESC
    `
  } catch (err) {
    console.error('DB error:', err)
  }

  return (
    <>
      <Navbar />

      <main className="bg-white min-h-screen py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-[#F97316] font-medium text-sm uppercase tracking-widest mb-2">
              Testimonials
            </p>
            <h1 className="text-4xl font-bold text-[#111111] mb-4">
              All Customer Reviews
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              See what our customers are saying about SpectrumCosmo products.
            </p>
          </div>

          {/* Reviews */}
          <LiveReviews initialReviews={reviews} />

        </div>
      </main>

      <Footer />
    </>
  )
}
