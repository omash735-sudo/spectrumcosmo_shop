'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, Flame, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  currency?: string;
}

// Local storage keys
const RECENT_SEARCHES_KEY = 'spectrumcosmo_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== searchTerm);
      const updated = [searchTerm, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Remove a single recent search
  const removeRecentSearch = useCallback((searchTerm: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== searchTerm);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Fetch trending products when search bar opens (no query)
  const fetchTrendingProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trending' }),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTrendingProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch trending products:', err);
    }
  }, []);

  // Search with debouncing and caching (handled by API)
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowRecent(false);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (value.length >= 2) {
      debounceTimer.current = setTimeout(() => {
        performSearch(value);
      }, 400);
    } else {
      setResults([]);
      if (value.length === 0 && isOpen) {
        setShowRecent(true);
      }
    }
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      router.push(`/products?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  // Handle clicking a recent search
  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm);
    saveRecentSearch(searchTerm);
    router.push(`/products?q=${encodeURIComponent(searchTerm)}`);
    setIsOpen(false);
    setQuery('');
  };

  // Handle clicking a product result
  const handleProductClick = (productId: string, productName: string) => {
    saveRecentSearch(productName);
    setIsOpen(false);
    setQuery('');
    router.push(`/product/${productId}`);
  };

  // Open search bar
  const openSearch = () => {
    setIsOpen(true);
    setShowRecent(true);
    setResults([]);
    setQuery('');
    fetchTrendingProducts();
  };

  // Close search bar
  const closeSearch = () => {
    setIsOpen(false);
    setShowRecent(false);
    setResults([]);
    setQuery('');
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  return (
    <>
      {/* Search button */}
      <button
        onClick={openSearch}
        className="p-2 hover:bg-[var(--background-secondary)] rounded-full transition min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Search"
      >
        <Search size={20} className="text-[var(--foreground)]" />
      </button>

      {/* Search modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-[var(--background-card)] z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 border-b border-[var(--border)]">
            <form onSubmit={handleSubmit} className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search products..."
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm sm:text-base bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[44px]"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </form>
            <button
              onClick={closeSearch}
              className="p-2 hover:bg-[var(--background-secondary)] rounded-full transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="text-[var(--foreground-muted)]" />
            </button>
          </div>

          {/* Results body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {/* Show search results when query exists */}
            {query.length >= 2 && (
              <>
                {results.length === 0 && !loading && (
                  <div className="text-center py-8 sm:py-12">
                    <Search size={32} className="mx-auto text-[var(--foreground-muted)] opacity-30 mb-3" />
                    <p className="text-[var(--foreground-muted)] text-sm">No products found</p>
                    <p className="text-xs text-[var(--foreground-muted)] opacity-70 mt-1">Try "hoodie" or "bracelet"</p>
                  </div>
                )}

                {results.length > 0 && (
                  <div className="space-y-2">
                    {results.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.id, product.name)}
                        className="w-full flex items-center gap-3 p-2 sm:p-3 border border-[var(--border)] rounded-xl hover:bg-[var(--background-secondary)] transition text-left min-h-[60px]"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 relative bg-[var(--background-secondary)] rounded-lg overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Search size={16} className="text-[var(--foreground-muted)] opacity-30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base text-[var(--foreground)] line-clamp-1">
                            {product.name}
                          </p>
                          <p className="text-xs sm:text-sm text-[var(--primary)] font-semibold">
                            {product.currency || 'MWK'} {product.price?.toLocaleString()}
                          </p>
                        </div>
                      </button>
                    ))}

                    <button
                      onClick={handleSubmit}
                      className="w-full mt-3 sm:mt-4 p-3 bg-[var(--background-secondary)] rounded-xl text-center text-[var(--foreground)] hover:bg-[var(--background)] transition text-sm sm:text-base min-h-[44px]"
                    >
                      See all results for "<span className="font-medium">{query}</span>" →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Show recent searches and trending when no query */}
            {query.length < 2 && (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--foreground-muted)]">
                        <Clock size={14} className="sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm font-medium">Recent searches</span>
                      </div>
                      <button
                        onClick={clearRecentSearches}
                        className="text-[10px] sm:text-xs text-[var(--foreground-muted)] hover:text-red-500 flex items-center gap-1 transition min-h-[32px]"
                      >
                        <Trash2 size={10} className="sm:w-3 sm:h-3" /> Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {recentSearches.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(term)}
                          className="group flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-[var(--background-secondary)] hover:bg-[var(--background)] rounded-full text-xs sm:text-sm transition min-h-[32px]"
                        >
                          <Clock size={10} className="sm:w-3 sm:h-3 text-[var(--foreground-muted)]" />
                          <span className="text-[var(--foreground)]">{term}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(term);
                            }}
                            className="ml-0.5 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X size={10} className="sm:w-3 sm:h-3 text-[var(--foreground-muted)] hover:text-red-500" />
                          </button>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Products */}
                {trendingProducts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 text-[var(--foreground-muted)]">
                      <Flame size={14} className="sm:w-4 sm:h-4 text-[var(--primary)]" />
                      <span className="text-xs sm:text-sm font-medium">Trending Products</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                      {trendingProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleProductClick(product.id, product.name)}
                          className="text-left group"
                        >
                          <div className="relative w-full aspect-square bg-[var(--background-secondary)] rounded-lg overflow-hidden mb-1.5 sm:mb-2 group-hover:shadow-md transition">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Search size={20} className="text-[var(--foreground-muted)] opacity-30" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-[var(--foreground)] line-clamp-1">
                            {product.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-[var(--primary)] font-semibold">
                            {product.currency || 'MWK'} {product.price?.toLocaleString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
