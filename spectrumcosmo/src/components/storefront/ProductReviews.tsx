'use client';

import { useEffect, useState } from 'react';
import StarRating from '@/components/ui/StarRating';
import { Star, User, Calendar, MessageSquare, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Review {
  id: number;
  customer_name: string;
  rating: number;
  review_text: string;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
  initialReviews?: Review[];
}

export default function ProductReviews({ productId, initialReviews = [] }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading, setLoading] = useState(!initialReviews.length);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (initialReviews.length > 0) return;
    
    fetch(`/api/reviews?product_id=${productId}`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [productId, initialReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setMessage({ type: 'error', text: 'Please select a rating' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/submit/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim() || 'Anonymous',
          review_text: reviewText,
          rating,
          product_id: productId,
          image_url: null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Review submitted! It will appear after approval.' });
        setRating(0);
        setReviewText('');
        setCustomerName('');
        setShowForm(false);
        
        setTimeout(() => {
          fetch(`/api/reviews?product_id=${productId}`)
            .then((res) => res.json())
            .then((newReviews) => setReviews(newReviews));
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Submission failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-brand-orange" size={32} />
      </div>
    );
  }

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews
    : 0;

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.floor(r.rating);
    if (star >= 1 && star <= 5) ratingCounts[star as keyof typeof ratingCounts]++;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">Customer Reviews</h3>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-5 py-2 rounded-full text-sm font-medium transition shadow-sm"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="bg-[var(--background-secondary)] rounded-2xl p-5 mb-6 border border-[var(--border)]">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-center">
              <span className="text-4xl font-bold text-[var(--foreground)]">{avgRating.toFixed(1)}</span>
              <div className="mt-1">
                <StarRating rating={avgRating} size={16} />
              </div>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">Based on {totalReviews} reviews</p>
            </div>
            <div className="flex-1 space-y-1 w-full">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star as keyof typeof ratingCounts];
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-[var(--foreground-muted)]">{star} ★</span>
                    <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-10 text-right text-[var(--foreground-muted)]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-[var(--foreground)]">Write Your Review</h4>
            <button onClick={() => setShowForm(false)} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">Rating *</label>
              <StarRating rating={rating} interactive onRate={setRating} size={28} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">Your Name (Optional)</label>
              <input
                type="text"
                className="w-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">Your Review *</label>
              <textarea
                rows={4}
                className="w-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this product..."
                required
              />
            </div>
            {message && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-50 w-full"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Review'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-[var(--background-secondary)] rounded-2xl border border-[var(--border)]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--background)] rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquare size={28} className="text-[var(--foreground-muted)]" />
          </div>
          <p className="text-[var(--foreground-muted)]">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {reviews.map((review) => (
            <div key={review.id} className="bg-[var(--background-card)] border border-[var(--border)] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
                    <User size={18} className="text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{review.customer_name || 'Anonymous'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={review.rating} size={14} />
                      <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[var(--foreground-muted)] text-xs sm:text-sm leading-relaxed mt-2">"{review.review_text}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
