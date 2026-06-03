import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ReviewSubmitForm from '@/components/storefront/ReviewSubmitForm';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export const metadata = { 
  title: 'Write a Review — SpectrumCosmo',
  description: 'Share your experience with SpectrumCosmo products'
};

export default function SubmitReviewPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full mb-4">
              <Sparkles size={14} className="text-orange-600" />
              <span className="text-xs font-medium text-orange-600">Share Your Story</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Write a Review</h1>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Your review will appear after approval by our team.
            </p>
          </div>

          {/* Review Form Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Share Your Experience</h2>
              <p className="text-sm text-gray-500 mt-0.5">Your feedback helps other customers make informed decisions</p>
            </div>
            <div className="p-6">
              <ReviewSubmitForm />
            </div>
          </div>

          {/* Back to Reviews Link */}
          <div className="text-center mt-6">
            <Link href="/reviews" className="text-sm text-orange-600 hover:text-orange-700 inline-flex items-center gap-1">
              ← Back to all reviews
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
