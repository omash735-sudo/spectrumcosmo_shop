'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Loader2, Trash2, Check, X, MessageSquare, Eye, EyeOff, Clock, RefreshCw, AlertCircle, Star } from 'lucide-react';
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

// ===== SKELETON =====
function ReviewsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="h-10 bg-[var(--background-secondary)] rounded w-24" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-[var(--background-secondary)] rounded-xl" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-[var(--background-secondary)] rounded w-20" />
        ))}
      </div>
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--background-secondary)] rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--background-secondary)] rounded w-1/4" />
                <div className="h-3 bg-[var(--background-secondary)] rounded w-3/4" />
              </div>
              <div className="h-8 bg-[var(--background-secondary)] rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
          stroke={star <= rating ? '#facc15' : 'var(--border)'}
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
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
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
      const res = await fetch('/api/admin/reviews', {
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
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
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

  const filtered = reviews.filter(r => {
    const matchesStatus = filter === 'all' ? true : r.status === filter;
    const matchesSearch = searchTerm === '' || 
      (r.user_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.review_text?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.product_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });
  
  const counts = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    reviewing: reviews.filter(r => r.status === 'reviewing').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    denied: reviews.filter(r => r.status === 'denied').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <ReviewsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Customer Reviews</h1>
              </div>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
                Manage and moderate customer feedback
              </p>
            </div>
            <button
              onClick={fetchReviews}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] transition min-h-[40px] text-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{counts.total}</p>
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Reviews</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-400">{counts.pending}</p>
            <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500">Pending</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-400">{counts.reviewing}</p>
            <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-500">Reviewing</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">{counts.approved}</p>
            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-500">Approved</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800 p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-rose-700 dark:text-rose-400">{counts.denied}</p>
            <p className="text-[10px] sm:text-xs text-rose-600 dark:text-rose-500">Denied</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(['all', 'pending', 'reviewing', 'approved', 'denied'] as const).map((f) => {
              const isActive = filter === f;
              const count = f === 'all' ? counts.total : counts[f];
              const colorMap = {
                all: 'bg-[var(--primary)] text-white',
                pending: 'bg-amber-500 text-white',
                reviewing: 'bg-blue-500 text-white',
                approved: 'bg-emerald-500 text-white',
                denied: 'bg-rose-500 text-white',
              };
              
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all min-h-[36px] sm:min-h-[40px] ${
                    isActive
                      ? colorMap[f] + ' shadow-sm'
                      : 'bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  {f === 'all' ? 'All' : statusLabels[f]}
                  {count > 0 && f !== 'all' && (
                    <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/30 text-white' : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={24} className="sm:w-7 sm:h-7 text-[var(--foreground-muted)] opacity-50" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-1">No reviews found</h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                {filter === 'all' ? 'No reviews have been submitted yet.' : `No ${filter} reviews match your filter.`}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-[var(--background-secondary)]">
                  <tr className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase tracking-wider">
                    <th className="text-left px-3 sm:px-6 py-2 sm:py-3">Customer</th>
                    <th className="text-left px-3 sm:px-6 py-2 sm:py-3">Rating</th>
                    <th className="text-left px-3 sm:px-6 py-2 sm:py-3 hidden sm:table-cell">Review</th>
                    <th className="text-left px-3 sm:px-6 py-2 sm:py-3">Status</th>
                    <th className="text-left px-3 sm:px-6 py-2 sm:py-3 hidden md:table-cell">Date</th>
                    <th className="text-right px-3 sm:px-6 py-2 sm:py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtered.map((review) => {
                    const userName = review.user_name || review.customer_name || 'Anonymous';
                    const userImage = review.user_image || review.image_url;
                    const StatusIcon = statusIcons[review.status];
                    const statusColor = statusColors[review.status];
                    
                    return (
                      <tr 
                        key={review.id} 
                        className={`hover:bg-[var(--background-secondary)] transition ${
                          review.status !== 'approved' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="px-3 sm:px-6 py-2 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {userImage ? (
                              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex-shrink-0">
                                <Image 
                                  src={userImage} 
                                  alt={userName} 
                                  fill 
                                  className="object-cover" 
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] sm:text-xs font-bold text-[var(--primary)]">
                                  {userName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] truncate max-w-[80px] sm:max-w-[120px]">
                              {userName}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4">
                          <StarRating rating={review.rating} size={12} />
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 max-w-[120px] sm:max-w-[200px] hidden sm:table-cell">
                          <p className="text-xs text-[var(--foreground-muted)] line-clamp-2">
                            {review.review_text || 'No review text provided.'}
                          </p>
                          {review.image_url && (
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 mt-1 sm:mt-2 rounded-md overflow-hidden border border-[var(--border)]">
                              <Image 
                                src={review.image_url} 
                                alt="Review attachment" 
                                fill 
                                className="object-cover" 
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4">
                          <div className="relative">
                            <select
                              value={review.status}
                              onChange={(e) => updateReview(review.id, { status: e.target.value as ReviewStatus })}
                              disabled={processingId === review.id}
                              className={`text-[10px] sm:text-xs rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 pr-6 sm:pr-8 appearance-none cursor-pointer focus:ring-2 focus:ring-[var(--primary)] ${statusColor} border-0 min-h-[32px] max-w-[100px] sm:max-w-[120px]`}
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabels[status]}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                              {StatusIcon && <StatusIcon size={8} className="sm:w-2.5 sm:h-2.5 opacity-70" />}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 text-[10px] text-[var(--foreground-muted)] whitespace-nowrap hidden md:table-cell">
                          {formatDate(review.created_at)}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4">
                          <div className="flex items-center justify-end gap-1">
                            {processingId === review.id ? (
                              <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin text-[var(--primary)]" />
                            ) : (
                              <button
                                onClick={() => deleteReview(review.id)}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                                title="Delete review"
                              >
                                <Trash2 size={14} className="sm:w-[15px] sm:h-[15px]" />
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

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-[var(--foreground-muted)]">
              Showing {filtered.length} of {reviews.length} reviews
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
              >
                Show all reviews
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
