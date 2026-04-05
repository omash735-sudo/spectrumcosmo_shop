import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import ReviewSubmitForm from '@/components/storefront/ReviewSubmitForm'
export const metadata = { title: 'Write a Review — SpectrumCosmo' }
export default function SubmitReviewPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-orange-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <p className="text-[#F97316] font-medium text-sm mb-2 uppercase tracking-widest">Share Your Story</p>
            <h1 className="text-4xl font-bold text-[#111111] mb-3">Write a Review</h1>
            <p className="text-gray-500">Your review will appear after approval by our team.</p>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-orange-100"><ReviewSubmitForm /></div>
        </div>
      </main>
      <Footer />
    </>
  )
}
