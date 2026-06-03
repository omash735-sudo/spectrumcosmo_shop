'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import { ChevronLeft, ChevronRight, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  compare_price?: number;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  const fetchFeatured = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      console.log('[FeaturedProducts] Fetching from /api/products/featured');
      
      const res = await fetch('/api/products/featured');
      
      console.log('[FeaturedProducts] Response status:', res.status, res.statusText);
      
      // Check if response is OK
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('[FeaturedProducts] Response data:', data);
      
      // Validate data is an array
      if (!Array.isArray(data)) {
        console.error('[FeaturedProducts] Data is not an array:', typeof data);
        setDebugInfo(`API returned ${typeof data}, expected array. Check API response.`);
        setProducts([]);
        return;
      }
      
      console.log(`[FeaturedProducts] Successfully loaded ${data.length} featured products`);
      
      if (data.length === 0) {
        setDebugInfo('No featured products found. Mark some products as featured in admin panel.');
      }
      
      setProducts(data);
    } catch (err) {
      console.error('[FeaturedProducts] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load featured products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatured();

    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 768) setItemsPerView(2);
      else if (window.innerWidth < 1024) setItemsPerView(3);
      else setItemsPerView(4);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, products.length - itemsPerView));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  // Manual retry button
  const handleRetry = () => {
    fetchFeatured();
  };

  // Error State
  if (error) {
    return (
      <div className="mb-12 p-6 bg-red-50 rounded-xl border border-red-200 text-center">
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-600 font-medium mb-1">Unable to load featured products</p>
        <p className="text-red-500 text-sm mb-3">{error}</p>
        {debugInfo && (
          <p className="text-xs text-gray-500 mb-3 bg-white p-2 rounded-lg">{debugInfo}</p>
        )}
        <button 
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  // Debug/Empty State (only shows when products length is 0 and not loading)
  if (!loading && products.length === 0) {
    return (
      <div className="mb-12 p-6 bg-yellow-50 rounded-xl border border-yellow-200 text-center">
        <Sparkles size={32} className="text-yellow-500 mx-auto mb-3" />
        <p className="text-yellow-700 font-medium mb-1">No featured products yet</p>
        <p className="text-yellow-600 text-sm mb-3">
          {debugInfo || 'Mark products as featured in the admin panel to display them here.'}
        </p>
        <Link 
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition"
        >
          Go to Admin Panel
        </Link>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gray-200 rounded-full"></div>
            <div className="h-7 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-3 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerView);
  const showControls = products.length > itemsPerView;

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Featured Products</h2>
          <Sparkles size={18} className="text-orange-400" />
        </div>
        <Link href="/products" className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 group">
          View all
          <ChevronRight size={14} className="group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        {showControls && (
          <>
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white rounded-full p-2 shadow-md border border-gray-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex >= products.length - itemsPerView}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white rounded-full p-2 shadow-md border border-gray-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {visibleProducts.map((product) => {
            const hasDiscount = product.compare_price && product.compare_price > product.price;
            const discountPercent = hasDiscount 
              ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) 
              : 0;

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image
                    src={product.image_url || '/placeholder-image.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                  {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      -{discountPercent}%
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 group-hover:text-orange-500 transition">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-orange-600 font-bold text-base">
                      <CurrencyPrice amountUsd={Number(product.price)} />
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-gray-400 line-through">
                        <CurrencyPrice amountUsd={Number(product.compare_price)} />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Dot Indicators */}
      {showControls && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.ceil(products.length / itemsPerView) }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx * itemsPerView)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                Math.floor(currentIndex / itemsPerView) === idx
                  ? 'bg-orange-500 w-4'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Hidden debug info - remove after fixing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 text-xs text-gray-400 border-t pt-2 text-center">
          Debug: {products.length} products loaded | Items per view: {itemsPerView} | Current index: {currentIndex}
        </div>
      )}
    </div>
  );
}
