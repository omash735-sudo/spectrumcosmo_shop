'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from 'lucide-react'; // <-- Removed Sparkles

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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

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
      if (width < 480) setItemsPerView(1);
      else if (width < 640) setItemsPerView(1.5);
      else if (width < 768) setItemsPerView(2);
      else if (width < 1024) setItemsPerView(3);
      else setItemsPerView(4);
      setCurrentIndex(0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSlides = Math.ceil(products.length / itemsPerView);
  const maxIndex = Math.max(0, products.length - Math.floor(itemsPerView));

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (loading || products.length === 0) {
    return null;
  }

  const visibleProducts = products.slice(currentIndex, currentIndex + Math.floor(itemsPerView));
  const showControls = products.length > Math.floor(itemsPerView);
  const currentSlide = Math.floor(currentIndex / Math.floor(itemsPerView));

  return (
    <div className="mb-10 sm:mb-14 md:mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <div className="w-1 h-5 sm:h-6 md:h-8 bg-gradient-to-t from-[var(--primary)] to-[var(--primary-hover)] rounded-full"></div>
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--foreground)]">Featured Products</h2>
            <p className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-muted)] mt-0.5">Handpicked just for you</p>
          </div>
          {/* <Sparkles size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] text-[var(--primary)]" /> */} {/* REMOVED */}
        </div>
        <Link
          href="/products"
          className="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium flex items-center gap-0.5 sm:gap-1 group"
        >
          View all
          <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Carousel */}
      <div 
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Buttons */}
        {showControls && (
          <>
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="absolute -left-2 sm:-left-3 md:-left-4 top-1/2 -translate-y-1/2 z-10 bg-[var(--background-card)] rounded-full p-1.5 sm:p-2 md:p-2.5 shadow-lg border border-[var(--border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--background-card)] disabled:hover:text-[var(--foreground)] disabled:hover:border-[var(--border)] min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Previous slide"
            >
              <ChevronLeft size={14} className="sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px]" />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="absolute -right-2 sm:-right-3 md:-right-4 top-1/2 -translate-y-1/2 z-10 bg-[var(--background-card)] rounded-full p-1.5 sm:p-2 md:p-2.5 shadow-lg border border-[var(--border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--background-card)] disabled:hover:text-[var(--foreground)] disabled:hover:border-[var(--border)] min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Next slide"
            >
              <ChevronRight size={14} className="sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px]" />
            </button>
          </>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
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
                className="group bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <div className="relative h-40 sm:h-44 md:h-48 bg-[var(--background-secondary)]">
                  <Image
                    src={product.image_url || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 480px) 100vw, (max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full shadow-md">
                      -{discountPercent}%
                    </div>
                  )}
                  {/* Quick view overlay on hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-[var(--background-card)] text-[var(--foreground)] px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      View Product
                    </span>
                  </div>
                </div>
                <div className="p-2.5 sm:p-3 md:p-3.5">
                  <h3 className="font-semibold text-[var(--foreground)] text-xs sm:text-sm md:text-base line-clamp-1 group-hover:text-[var(--primary)] transition">
                    {product.name}
                  </h3>
                  <div className="mt-1 sm:mt-1.5 md:mt-2 flex items-baseline gap-1 sm:gap-1.5 md:gap-2 flex-wrap">
                    <span className="text-[var(--primary)] font-bold text-sm sm:text-base md:text-lg">
                      <CurrencyPrice amountUsd={Number(product.price)} />
                    </span>
                    {hasDiscount && product.compare_price && (
                      <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)] line-through">
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
      {showControls && totalSlides > 1 && (
        <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 md:mt-6">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx * Math.floor(itemsPerView))}
              className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 min-h-[4px] ${
                currentSlide === idx
                  ? 'bg-[var(--primary)] w-4 sm:w-5 md:w-6'
                  : 'bg-[var(--border)] w-1.5 sm:w-2 md:w-2.5 hover:bg-[var(--primary)]/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
