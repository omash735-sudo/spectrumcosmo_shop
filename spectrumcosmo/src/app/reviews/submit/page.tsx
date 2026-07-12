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
      <main className="min-h-screen bg-[var(--background)] py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="manga-bg hero-manga rounded-xl sm:rounded-2xl overflow-hidden mb-8">
            <div className="relative z-10 text-center p-6 sm:p-8 bg-[var(--background-card)]/95">
              <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 px-3 py-1 rounded-full mb-4">
                <Sparkles size={14} className="text-[var(--primary)]" />
                <span className="text-xs font-medium text-[var(--primary)]">Share Your Story</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">Write a Review</h1>
              <p className="text-[var(--foreground-muted)] mt-2 max-w-md mx-auto">
                Your review will appear after approval by our team.
              </p>
            </div>
          </div>

          <div className="bg-[var(--background-card)] rounded-2xl shadow-lg border border-[var(--border)] overflow-hidden">
            <div className="bg-[var(--background-secondary)] px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--foreground)]">Share Your Experience</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Your feedback helps other customers make informed decisions</p>
            </div>
            <div className="p-6">
              <ReviewSubmitForm />
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/reviews" className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] inline-flex items-center gap-1 transition">
              ← Back to all reviews
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
