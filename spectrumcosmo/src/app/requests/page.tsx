'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Search, Filter, Heart, MessageSquare, Image as ImageIcon, 
  Loader2, Plus, ChevronDown, Calendar, ThumbsUp, X
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import RequestStatusBadge from '@/components/requests/RequestStatusBadge';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  request_count: number;
}

interface Request {
  id: string;
  title: string;
  description: string;
  status: string;
  like_count: number;
  created_at: string;
  category_name: string;
  category_id: string;
  image_count: number;
  user_liked: number;
}

const ITEMS_PER_PAGE = 12;

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('most_voted');
  const [showFilters, setShowFilters] = useState(false);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/requests/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Load requests
  const loadRequests = useCallback(async (reset = true) => {
    const currentOffset = reset ? 0 : offset;
    
    if (reset) {
      setLoading(true);
      setRequests([]);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        offset: String(currentOffset),
        sort: sortBy,
      });
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (search) {
        params.append('search', search);
      }

      const res = await fetch(`/api/requests/public?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load requests');

      const data = await res.json();
      
      if (reset) {
        setRequests(data.data || []);
        setOffset(currentOffset + ITEMS_PER_PAGE);
      } else {
        setRequests(prev => [...prev, ...(data.data || [])]);
        setOffset(currentOffset + ITEMS_PER_PAGE);
      }
      
      setTotal(data.pagination?.total || 0);
      setHasMore(data.pagination?.hasMore || false);
    } catch (err) {
      console.error('Failed to load requests:', err);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, selectedCategory, sortBy, offset]);

  // Initial load and filter changes
  useEffect(() => {
    loadRequests(true);
  }, [search, selectedCategory, sortBy]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  // Handle search clear
  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  // Handle like toggle
  const handleLike = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const res = await fetch(`/api/requests/${requestId}/like`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to like');
      }
      
      const data = await res.json();
      
      // Update local state
      setRequests(prev => prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            like_count: data.liked ? req.like_count + 1 : req.like_count - 1,
            user_liked: data.liked ? 1 : 0,
          };
        }
        return req;
      }));
      
      toast.success(data.liked ? 'Liked!' : 'Unliked');
    } catch (err: any) {
      toast.error(err.message || 'Failed to like');
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    loadRequests(false);
  };

  // Empty state
  const showEmptyState = !loading && requests.length === 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 px-3 py-1 rounded-full mb-3">
                  <span className="text-xs font-medium text-[var(--primary)]">Community</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
                  Community Requests
                </h1>
                <p className="text-[var(--foreground-muted)] mt-1">
                  Vote on ideas and suggest products you'd love to see
                </p>
              </div>
              <Link
                href="/requests/submit"
                className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[var(--primary-hover)] transition shadow-sm min-h-[44px]"
              >
                <Plus size={18} />
                Submit Request
              </Link>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search requests..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary-hover)] transition min-h-[44px] min-w-[80px] flex items-center justify-center"
              >
                Search
              </button>
            </form>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-xl hover:bg-[var(--background-secondary)] transition min-h-[44px]"
            >
              <Filter size={18} />
              <span>Filters</span>
              <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 mb-8 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name} ({cat.request_count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="most_voted">Most Voted</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Results count */}
          {!loading && (
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              {total} {total === 1 ? 'request' : 'requests'} found
            </p>
          )}

          {/* Requests Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={36} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : showEmptyState ? (
            <div className="text-center py-20 bg-[var(--background-card)] rounded-2xl border border-[var(--border)]">
              <div className="w-16 h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-[var(--foreground-muted)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No requests found</h3>
              <p className="text-[var(--foreground-muted)] max-w-md mx-auto">
                {search || selectedCategory !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Be the first to submit a request!'}
              </p>
              {(search || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSearchInput('');
                    setSelectedCategory('all');
                  }}
                  className="mt-4 text-[var(--primary)] hover:underline text-sm"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {requests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/requests/${request.id}`}
                    className="group bg-[var(--background-card)] rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition line-clamp-1">
                            {request.title}
                          </h3>
                          {request.category_name && (
                            <span className="text-xs text-[var(--foreground-muted)]">
                              {request.category_name}
                            </span>
                          )}
                        </div>
                        <RequestStatusBadge status={request.status} />
                      </div>

                      {/* Description */}
                      <p className="text-sm text-[var(--foreground-muted)] line-clamp-2 mb-4">
                        {request.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
                          {request.image_count > 0 && (
                            <span className="flex items-center gap-1">
                              <ImageIcon size={14} />
                              {request.image_count}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Like Button */}
                        <button
                          onClick={(e) => handleLike(request.id, e)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition hover:bg-[var(--background-secondary)] text-xs"
                        >
                          <Heart 
                            size={16} 
                            className={`transition ${request.user_liked ? 'fill-red-500 text-red-500' : 'text-[var(--foreground-muted)] group-hover:text-red-400'}`}
                          />
                          <span className={`font-medium ${request.user_liked ? 'text-red-500' : 'text-[var(--foreground-muted)]'}`}>
                            {request.like_count}
                          </span>
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border)] rounded-xl hover:bg-[var(--background-secondary)] transition font-medium min-h-[48px] min-w-[160px]"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}

              {!hasMore && requests.length > 0 && (
                <p className="text-center text-sm text-[var(--foreground-muted)] mt-6">
                  You've seen all {total} requests
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
