'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/storefront/ProductCard';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import { Search, SlidersHorizontal, X, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useProductsWithCache } from '@/hooks/useProductsWithCache';
import { useAppMode } from '@/hooks/useAppMode';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  image_url: string;
  status?: string;
  stock_quantity?: number;
  category_name?: string;
  category?: string;
  description?: string;
}

function toProductCardProps(product: any): ProductCardProps {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    compare_price: product.compare_price ?? undefined,
    image_url: product.image_url ?? '',
    status: product.status,
    stock_quantity: product.stock_quantity,
    category_name: product.category_name,
    description: product.description ?? undefined,
  };
}

const heroSettings = {
  titleColor: '#FFFFFF',
  subtitleColor: '#FFFFFF',
  titleAlignment: 'center' as const,
  subtitleAlignment: 'center' as const,
  verticalPosition: 'bottom' as const,
  buttonBgColor: '#C96712',
  buttonTextColor: '#FFFFFF',
};

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categoryNames, setCategoryNames] = useState<string[]>(['All']);
  const { isAppMode } = useAppMode();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category') || 'All';
    const q = params.get('q') || '';
    setSelectedCategory(category);
    setSearchQuery(q);
  }, []);

  const {
    products,
    categories,
    loading,
    refreshing,
    fromCache,
    error,
    refresh,
  } = useProductsWithCache(
    selectedCategory !== 'All' ? selectedCategory : undefined,
    searchQuery || undefined
  );

  useEffect(() => {
    if (categories && categories.length > 0) {
      const names = ['All', ...categories.map((c: any) => c.name)];
      setCategoryNames(names);
    }
  }, [categories]);

  const productCardProps = products.map(toProductCardProps);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory !== 'All') params.append('category', selectedCategory);
    window.location.href = `/products?${params.toString()}`;
  };

  const handleCategorySelect = (category: string) => {
    const params = new URLSearchParams();
    if (category !== 'All') params.append('category', category);
    if (searchQuery) params.append('q', searchQuery);
    window.location.href = `/products?${params.toString()}`;
  };

  const clearFilters = () => {
    window.location.href = '/products';
  };

  const hasFilters = selectedCategory !== 'All';

  if (loading && !fromCache) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <HeroCarousel
        titleColor={heroSettings.titleColor}
        subtitleColor={heroSettings.subtitleColor}
        titleAlignment={heroSettings.titleAlignment}
        subtitleAlignment={heroSettings.subtitleAlignment}
        verticalPosition={heroSettings.verticalPosition}
        buttonBgColor={heroSettings.buttonBgColor}
        buttonTextColor={heroSettings.buttonTextColor}
      />

      <div className="bg-[var(--background-secondary)] py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturedProducts />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 manga-bg hero-manga">
        <div className="relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
                  {searchQuery ? `Search results for "${searchQuery}"` : selectedCategory !== 'All' ? selectedCategory : 'All Products'}
                </h1>
                {isAppMode && fromCache && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">
                    <WifiOff size={12} />
                    Cached
                  </span>
                )}
                {isAppMode && refreshing && (
                  <Loader2 size={16} className="animate-spin text-[var(--primary)]" />
                )}
              </div>
              <p className="text-[var(--foreground-muted)] text-sm mt-1">
                {productCardProps.length} {productCardProps.length === 1 ? 'product' : 'products'} found
                {fromCache && ' (cached)'}
              </p>
            </div>
            {isAppMode && (
              <button
                onClick={() => refresh()}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--background-card)] border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition disabled:opacity-50"
              >
                {refreshing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Wifi size={16} />
                )}
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>

          <div className="mb-8">
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for anime merch, apparel, accessories..."
                  className="w-full border border-[var(--border)] bg-[var(--background-card)] rounded-2xl py-4 pl-6 pr-14 text-base text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white p-2.5 rounded-xl transition shadow-md"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
              </div>
              {searchQuery && (
                <div className="text-center mt-3">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[var(--foreground-muted)]" />
              <span className="text-sm font-medium text-[var(--foreground-muted)]">Filters:</span>
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs">
                  Category: {selectedCategory}
                  <button onClick={clearFilters} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                <X size={12} /> Clear all filters
              </button>
            )}
          </div>

          <div className="mb-10">
            <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:overflow-visible md:mx-0 md:px-0">
              <div className="flex gap-2 min-w-max md:flex-wrap md:justify-center">
                {categoryNames.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? 'bg-[var(--primary)] text-white shadow-md shadow-orange-200 dark:shadow-none'
                          : 'bg-[var(--background-card)] text-[var(--foreground-muted)] hover:bg-[var(--border)]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-center py-8 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-800 mb-6">
              <p className="text-red-600 dark:text-red-400">Failed to load products. {fromCache ? 'Showing cached data.' : 'Please try again.'}</p>
              <button
                onClick={() => refresh()}
                className="mt-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
              >
                Retry
              </button>
            </div>
          )}

          {productCardProps.length === 0 && !error ? (
            <div className="text-center py-20 bg-[var(--background-card)] rounded-2xl border border-[var(--border)]">
              <div className="w-20 h-20 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-[var(--foreground-muted)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No products found</h3>
              <p className="text-[var(--foreground-muted)]">Try adjusting your search or browse our categories.</p>
              <Link href="/products" className="inline-block mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium">
                View all products →
              </Link>
            </div>
          ) : (
            <div 
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              data-onboarding="product-grid"
            >
              {productCardProps.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
