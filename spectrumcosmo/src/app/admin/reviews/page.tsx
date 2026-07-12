'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Loader2, Trash2, Check, X, MessageSquare, Eye, EyeOff, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

type ReviewStatus = 'pending' | 'reviewing' | 'approved' | 'denied';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  status: ReviewStatus;
  created_at: string;
  user_name?: string;
  customer_name?: string;
  user_image?: string;
  image_url?: string;
  product_id?: string;
  product_name?: string;
}

const statusOptions: readonly ReviewStatus[] = ['pending', 'reviewing', 'approved', 'denied'] as const;

const statusLabels: Record<ReviewStatus, string> = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  approved: 'Approved',
  denied: 'Denied',
};

const statusColors: Record<ReviewStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  reviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  denied: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
};

const statusIcons: Record<ReviewStatus, any> = {
  pending: Clock,
  reviewing: Eye,
  approved: Check,
  denied: X,
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={star <= rating ? '#facc15' : 'none'}
          stroke={star <= rating ? '#facc15' : '#d1d5db'}
          strokeWidth="1.5"
          className="transition-colors"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reviews');
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch reviews:', errorMessage);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const updateReview = async (id: string, updates: Partial<Review>) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error('Failed to update review');
      toast.success('Review status updated');
      await fetchReviews();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to update review:', errorMessage);
      toast.error('Failed to update review');
    } finally {
      setProcessingId(null);
    }
  };

  const deleteReview = async (id: string) => {
    const confirmed = window.confirm('Delete this review permanently? This action cannot be undone.');
    if (!confirmed) return;
    
    setProcessingId(id);
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete review');
      toast.success('Review deleted');
      await fetchReviews();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to delete review:', errorMessage);
      toast.error('Failed to delete review');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = reviews.filter(r => filter === 'all' ? true : r.status === filter);
  
  const counts = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    reviewing: reviews.filter(r => r.status === 'reviewing').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    denied: reviews.filter(r => r.status === 'denied').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Reviews</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage and moderate customer feedback
              </p>
            </div>
            <button
              onClick={fetchReviews}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Reviews</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 p-4 shadow-sm">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{counts.pending}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Pending</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 p-4 shadow-sm">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{counts.reviewing}</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Reviewing</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 shadow-sm">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{counts.approved}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">Approved</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 p-4 shadow-sm">
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{counts.denied}</p>
            <p className="text-xs text-rose-600 dark:text-rose-500">Denied</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'pending', 'reviewing', 'approved', 'denied'] as const).map((f) => {
            const isActive = filter === f;
            const count = f === 'all' ? counts.total : counts[f];
            
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? f === 'pending'
                      ? 'bg-amber-500 text-white shadow-md'
                      : f === 'reviewing'
                        ? 'bg-blue-500 text-white shadow-md'
                        : f === 'approved'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : f === 'denied'
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-orange-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-orange-200 dark:hover:border-orange-800'
                }`}
              >
                {f === 'all' ? 'All' : statusLabels[f]}
                {count > 0 && f !== 'all' && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/30 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} className="text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No reviews found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filter === 'all' ? 'No reviews have been submitted yet.' : `No ${filter} reviews match your filter.`}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 text-orange-500 hover:text-orange-600 text-sm"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Customer</th>
                    <th className="text-left px-6 py-3">Rating</th>
                    <th className="text-left px-6 py-3">Review</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="text-right px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((review) => {
                    const userName = review.user_name || review.customer_name || 'Anonymous';
                    const userImage = review.user_image || review.image_url;
                    const StatusIcon = statusIcons[review.status];
                    const statusColor = statusColors[review.status];
                    
                    return (
                      <tr 
                        key={review.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                          review.status !== 'approved' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {userImage ? (
                              <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                                <Image 
                                  src={userImage} 
                                  alt={userName} 
                                  fill 
                                  className="object-cover" 
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                  {userName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {userName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StarRating rating={review.rating} size={14} />
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {review.review_text || 'No review text provided.'}
                          </p>
                          {review.image_url && (
                            <div className="relative w-10 h-10 mt-2 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                              <Image 
                                src={review.image_url} 
                                alt="Review attachment" 
                                fill 
                                className="object-cover" 
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <select
                              value={review.status}
                              onChange={(e) => updateReview(review.id, { status: e.target.value as ReviewStatus })}
                              disabled={processingId === review.id}
                              className={`text-xs rounded-lg px-3 py-1.5 pr-8 appearance-none cursor-pointer focus:ring-2 focus:ring-orange-500 ${statusColor} border-0`}
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabels[status]}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                              {StatusIcon && <StatusIcon size={10} className="opacity-70" />}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(review.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {processingId === review.id ? (
                              <Loader2 size={16} className="animate-spin text-orange-500" />
                            ) : (
                              <button
                                onClick={() => deleteReview(review.id)}
                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition"
                                title="Delete review"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {filtered.length} of {reviews.length} reviews
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
