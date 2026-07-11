// app/reviews/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import LiveReviews from '@/components/storefront/LiveReviews';
import StarRating from '@/components/ui/StarRating';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Loader2, CheckCircle, Clock, XCircle, AlertCircle, Edit2, Save, X, 
  Star, Filter, ChevronDown, ThumbsUp, Share2, Sparkles, 
  ArrowRight, Calendar, User, ShoppingBag, Verified
} from 'lucide-react';

// Types
type ReviewStatus = 'pending' | 'reviewing' | 'approved' | 'denied';

interface Review {
  id: number;
  customer_name: string;
  user_id?: number;
  review_text: string;
  rating: number;
  status: ReviewStatus;
  created_at: string;
  updated_at?: string;
  image_url?: string;
  product_name?: string;
  product_id?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

const statusConfig: Record<ReviewStatus, { label: string; icon: any; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/30' },
  reviewing: { label: 'Reviewing', icon: AlertCircle, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30' },
  denied: { label: 'Denied', icon: XCircle, color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30' },
};

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Rating' },
  { value: 'lowest', label: 'Lowest Rating' },
];

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingMy, setLoadingMy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const totalReviews = allReviews.length;
  const averageRating = totalReviews > 0 
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
    : 0;
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  allReviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) ratingCounts[r.rating as keyof typeof ratingCounts]++;
  });

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingAll(true);
      try {
        const res = await fetch('/api/reviews');
        const data = await res.json();
        setAllReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAll(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchMyReviews = async () => {
      if (!user) {
        setMyReviews([]);
        return;
      }
      if (activeTab === 'my') {
        setLoadingMy(true);
        try {
          const res = await fetch(`/api/reviews?user_id=${user.id}`);
          const data = await res.json();
          setMyReviews(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingMy(false);
        }
      }
    };
    fetchMyReviews();
  }, [activeTab, user]);

  useEffect(() => {
    let filtered = [...allReviews];
    if (ratingFilter !== null) {
      filtered = filtered.filter(r => Math.floor(r.rating) === ratingFilter);
    }
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    setFilteredReviews(filtered);
  }, [allReviews, ratingFilter, sortBy]);

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setEditText(review.review_text);
    setEditRating(review.rating);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditRating(5);
  };

  const handleSaveEdit = async (reviewId: number) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewId,
          review_text: editText,
          rating: editRating,
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setMyReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, review_text: updated.review_text, rating: updated.rating } : r
        ));
        handleCancelEdit();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update review');
      }
    } catch (err) {
      alert('Error updating review');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHelpful = async (reviewId: number) => {
    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark as helpful');
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header - With Manga Panel */}
          <div className="manga-bg hero-manga rounded-xl sm:rounded-2xl overflow-hidden mb-12">
            <div className="relative z-10 text-center p-6 sm:p-8 md:p-10 bg-[var(--background-card)]/95">
              <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 px-3 py-1 rounded-full mb-4">
                <Sparkles size={14} className="text-[var(--primary)]" />
                <span className="text-xs font-medium text-[var(--primary)]">Testimonials</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">Customer Reviews</h1>
              <p className="text-[var(--foreground-muted)] mt-2 max-w-xl mx-auto">See what our customers are saying about SpectrumCosmo products.</p>
            </div>
          </div>

          {/* Rating Summary Card */}
          {allReviews.length > 0 && (
            <div className="bg-[var(--background-card)] rounded-2xl p-6 mb-8 shadow-sm border border-[var(--border)]">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--foreground)]">{averageRating.toFixed(1)}</div>
                  <StarRating rating={averageRating} size={20} />
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">Based on {totalReviews} reviews</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = ratingCounts[star as keyof typeof ratingCounts];
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <button
                        key={star}
                        onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                        className="w-full flex items-center gap-2 group"
                      >
                        <span className="text-sm text-[var(--foreground-muted)] w-8">{star} ★</span>
                        <div className="flex-1 h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-xs text-[var(--foreground-muted)] w-10">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div className="inline-flex bg-[var(--background-secondary)] rounded-full p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === 'all'
                    ? 'bg-[var(--background-card)] text-[var(--primary)] shadow-sm'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--primary)]'
                }`}
              >
                All Reviews
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === 'my'
                    ? 'bg-[var(--background-card)] text-[var(--primary)] shadow-sm'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--primary)]'
                }`}
              >
                My Reviews
              </button>
            </div>
            
            {activeTab === 'all' && allReviews.length > 0 && (
              <div className="flex items-center gap-2">
                {ratingFilter !== null && (
                  <button
                    onClick={() => setRatingFilter(null)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs font-medium"
                  >
                    {ratingFilter} ★ <X size={12} />
                  </button>
                )}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-[var(--background-card)] border border-[var(--border)] rounded-full px-4 py-1.5 pr-8 text-sm text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* All Reviews Tab */}
          {activeTab === 'all' && (
            loadingAll ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-[var(--primary])" size={40} />
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-16 bg-[var(--background-card)] rounded-2xl border border-[var(--border)]">
                <Star size={48} className="text-[var(--foreground-muted)] mx-auto mb-4" />
                <p className="text-[var(--foreground-muted)]">No reviews found</p>
                {(ratingFilter !== null || sortBy !== 'newest') && (
                  <button
                    onClick={() => { setRatingFilter(null); setSortBy('newest'); }}
                    className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm"
                  >
                    Clear filters →
                  </button>
                )}
              </div>
            ) : (
              <LiveReviews initialReviews={filteredReviews} />
            )
          )}

          {/* My Reviews Tab */}
          {activeTab === 'my' && (
            !user ? (
              <div className="text-center py-16 bg-[var(--background-card)] rounded-2xl border border-[var(--border)]">
                <User size={48} className="text-[var(--foreground-muted)] mx-auto mb-4" />
                <p className="text-[var(--foreground-muted)] mb-4">Please login to see your reviews</p>
                <a href="/login" className="inline-block bg-[var(--primary)] text-white px-6 py-2 rounded-full font-medium hover:bg-[var(--primary-hover)] transition">
                  Login
                </a>
              </div>
            ) : loadingMy ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-[var(--primary])" size={40} />
              </div>
            ) : myReviews.length === 0 ? (
              <div className="text-center py-16 bg-[var(--background-card)] rounded-2xl border border-[var(--border)]">
                <Edit2 size={48} className="text-[var(--foreground-muted)] mx-auto mb-4" />
                <p className="text-[var(--foreground-muted)] mb-4">You haven't written any reviews yet</p>
                <Link href="/reviews/submit" className="inline-block bg-[var(--primary)] text-white px-6 py-2 rounded-full font-medium hover:bg-[var(--primary-hover)] transition">
                  Write a Review
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {myReviews.map((review) => {
                  const statusKey = (review.status === 'pending' || review.status === 'reviewing' || review.status === 'approved' || review.status === 'denied')
                    ? review.status
                    : 'pending';
                  const StatusIcon = statusConfig[statusKey]?.icon || AlertCircle;
                  const statusClass = statusConfig[statusKey]?.color || 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';
                  const canEdit = review.status === 'pending';
                  const isEditing = editingId === review.id;

                  return (
                    <div key={review.id} className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] p-6 shadow-sm hover:shadow-md transition">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-[var(--foreground)]">Rating:</span>
                                <select 
                                  value={editRating} 
                                  onChange={(e) => setEditRating(parseInt(e.target.value))}
                                  className="border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-lg px-3 py-1.5 text-sm focus:ring-[var(--primary)]"
                                >
                                  {[5,4,3,2,1].map(r => (
                                    <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>
                                  ))}
                                </select>
                              </div>
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                                rows={4}
                              />
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleSaveEdit(review.id)}
                                  disabled={isSaving}
                                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 inline-flex items-center gap-2"
                                >
                                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                  {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="border border-[var(--border)] px-5 py-2 rounded-xl text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition inline-flex items-center gap-2"
                                >
                                  <X size={14} />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <StarRating rating={review.rating} size={18} />
                              {review.product_name && (
                                <div className="flex items-center gap-1 mt-2">
                                  <ShoppingBag size={12} className="text-[var(--foreground-muted)]" />
                                  <p className="text-xs text-[var(--foreground-muted)]">Product: {review.product_name}</p>
                                </div>
                              )}
                              <p className="text-[var(--foreground)] text-sm leading-relaxed mt-3">"{review.review_text}"</p>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                            <StatusIcon size={12} />
                            {statusConfig[statusKey]?.label || review.status}
                          </span>
                          {canEdit && !isEditing && (
                            <button
                              onClick={() => handleEdit(review)}
                              className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium inline-flex items-center gap-1"
                            >
                              <Edit2 size={14} />
                              Edit Review
                            </button>
                          )}
                        </div>
                      </div>
                      {!isEditing && review.image_url && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--border)] mt-3">
                          <Image src={review.image_url} alt="Review" fill className="object-cover" />
                        </div>
                      )}
                      {!isEditing && (
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border)]">
                          <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                            <Calendar size={12} />
                            <span>{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                          {review.updated_at && review.updated_at !== review.created_at && (
                            <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                              <Edit2 size={12} />
                              <span>Edited</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
