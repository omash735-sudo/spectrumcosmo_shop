// components/storefront/FeaturedProducts.tsx
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

  if (loading || products.length === 0) {
    return null;
  }

  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerView);
  const showControls = products.length > itemsPerView;

  return (
    <div className="mb-12 sm:mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-1 h-6 sm:h-8 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Handpicked just for you</p>
          </div>
          <Sparkles size={16} className="text-orange-400 sm:w-5 sm:h-5 md:w-[20px] md:h-[20px]" />
        </div>
        <Link
          href="/products"
          className="text-xs sm:text-sm text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 font-medium flex items-center gap-1 group"
        >
          View all
          <ChevronRight size={14} className="sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
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
              className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-1.5 sm:p-2.5 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800 disabled:hover:text-gray-700"
            >
              <ChevronLeft size={14} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex >= products.length - itemsPerView}
              className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-1.5 sm:p-2.5 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {visibleProducts.map((product) => {
            let discountPercent = 0;
            const hasDiscount = !!product.compare_price && product.compare_price > product.price;
            if (hasDiscount && product.compare_price) {
              discountPercent = Math.round(
                ((product.compare_price - product.price) / product.compare_price) * 100
              );
            }

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                  <Image
                    src={product.image_url || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full shadow-md">
                      -{discountPercent}%
                    </div>
                  )}
                </div>
                <div className="p-2.5 sm:p-3">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm line-clamp-1 group-hover:text-orange-500 transition">
                    {product.name}
                  </h3>
                  <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-orange-600 dark:text-orange-500 font-bold text-sm sm:text-base">
                      <CurrencyPrice amountUsd={Number(product.price)} />
                    </span>
                    {hasDiscount && product.compare_price && (
                      <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 line-through">
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
        <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
          {Array.from({ length: Math.ceil(products.length / itemsPerView) }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx * itemsPerView)}
              className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                Math.floor(currentIndex / itemsPerView) === idx
                  ? 'bg-orange-500 w-4 sm:w-6'
                  : 'bg-gray-300 dark:bg-gray-600 w-1.5 sm:w-3 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
