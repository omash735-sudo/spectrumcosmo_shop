'use client';

import { useEffect, useState } from 'react';
import StarRating from '@/components/ui/StarRating';

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
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialReviews.length > 0) return;
    fetch(`/api/reviews?product_id=${productId}`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data);
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
      setMessage('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
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
        setMessage('Review submitted! It will appear after approval.');
        setRating(0);
        setReviewText('');
        setCustomerName('');
        setTimeout(() => {
          fetch(`/api/reviews?product_id=${productId}`)
            .then((res) => res.json())
            .then((newReviews) => setReviews(newReviews));
        }, 2000);
      } else {
        setMessage(data.error || 'Submission failed');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <p className="text-center text-gray-500 py-8">Loading reviews...</p>;

  return (
    <div>
      {/* Review Form */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold mb-3">Write a review</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <StarRating rating={rating} interactive onRate={setRating} size={28} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Your name (optional)</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2 text-sm"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="...your_name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Your review</label>
            <textarea
              rows={3}
              className="w-full border rounded-lg p-2 text-sm"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
            />
          </div>
          {message && <p className="text-sm text-orange-600">{message}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>

      {/* Existing Reviews */}
      {reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border rounded-xl p-5 shadow-sm bg-white">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <StarRating rating={review.rating} size={16} />
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 mt-3 leading-relaxed">“{review.review_text}”</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <span>— {review.customer_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
