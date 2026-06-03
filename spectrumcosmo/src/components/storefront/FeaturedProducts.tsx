'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  image_url: string;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/products/featured');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProducts(data);
          }
        }
      } catch (error) {
        // Silent fail - featured products not critical for page to work
        console.warn('Featured products unavailable');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeatured();

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setItemsPerView(1);
      else if (width < 768) setItemsPerView(2);
      else if (width < 1024) setItemsPerView(3);
      else setItemsPerView(4);
      setCurrentIndex(0);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, Math.max(0, products.length - itemsPerView)));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  // Don't show anything while loading or if no products
  if (loading || products.length === 0) {
    return null;
  }

  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerView);
  const showControls = products.length > itemsPerView;

  return (
    <div className="mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-gray-500 text-sm mt-0.5">Handpicked just for you</p>
          </div>
          <Sparkles size={20} className="text-orange-400" />
        </div>
        <Link
          href="/products"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 group"
        >
          View all
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Navigation Buttons */}
        {showControls && (
          <>
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2.5 shadow-lg border border-gray-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex >= products.length - itemsPerView}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2.5 shadow-lg border border-gray-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image
                    src={product.image_url || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
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
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(products.length / itemsPerView) }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx * itemsPerView)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                Math.floor(currentIndex / itemsPerView) === idx
                  ? 'bg-orange-500 w-6'
                  : 'bg-gray-300 w-3 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
