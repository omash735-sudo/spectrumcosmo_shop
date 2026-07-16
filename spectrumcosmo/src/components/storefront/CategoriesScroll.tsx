'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FolderOpen, ChevronLeft, ChevronRight, Sparkles, ChevronRight as ArrowRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

type Category = {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
};

export default function CategoriesScroll({ categories }: { categories: Category[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      setShowLeftButton(false);
      setShowRightButton(false);
      return;
    }
    setShowLeftButton(container.scrollLeft > 10);
    setShowRightButton(
      container.scrollLeft + container.clientWidth < container.scrollWidth - 10
    );
    
    // Update active index for dots
    const itemWidth = container.scrollWidth / categories.length;
    const activeIdx = Math.round(container.scrollLeft / itemWidth);
    setActiveIndex(Math.min(activeIdx, categories.length - 1));
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScrollButtons();
    container.addEventListener('scroll', checkScrollButtons);
    window.addEventListener('resize', checkScrollButtons);
    return () => {
      container.removeEventListener('scroll', checkScrollButtons);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 sm:mb-10 lg:mb-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1 h-4 sm:h-5 md:h-7 bg-gradient-to-t from-[var(--primary)] to-[var(--primary-hover)] rounded-full"></div>
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[var(--foreground)]">Shop by Category</h2>
          <Sparkles size={12} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] text-[var(--primary)]" />
        </div>
        <Link 
          href="/products" 
          className="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium flex items-center gap-1 group"
        >
          View all
          <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Categories Carousel */}
      <div className="relative group/carousel">
        {/* Left Navigation Button */}
        {showLeftButton && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-3 z-10 bg-[var(--background-card)] dark:bg-[var(--background-card)] rounded-full p-1.5 sm:p-2 shadow-lg border border-[var(--border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 hidden md:flex items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
          </button>
        )}
        
        {/* Right Navigation Button */}
        {showRightButton && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-3 z-10 bg-[var(--background-card)] dark:bg-[var(--background-card)] rounded-full p-1.5 sm:p-2 shadow-lg border border-[var(--border)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 hidden md:flex items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight size={14} className="sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Scrollable Categories Grid */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-2 sm:gap-3 md:gap-4 pb-2 sm:pb-3 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group/category flex-shrink-0 w-[80px] sm:w-[100px] md:w-[120px] lg:w-[140px] snap-start transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] rounded-xl"
            >
              <div className="relative">
                {/* Image Container */}
                <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background)] shadow-sm group-hover/category:shadow-xl transition-all duration-300">
                  {cat.image_url ? (
                    <Image
                      src={cat.image_url}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover/category:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30">
                      <FolderOpen size={20} className="sm:w-6 sm:h-6 md:w-7 md:h-7 text-[var(--primary)]" />
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/category:opacity-100 transition-opacity duration-300" />
                  
                  {/* Category Name Overlay (visible on hover) */}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 md:p-3 transform translate-y-full group-hover/category:translate-y-0 transition-transform duration-300">
                    <span className="block text-white text-[10px] sm:text-xs font-semibold text-center truncate">
                      Shop {cat.name} →
                    </span>
                  </div>
                </div>
                
                {/* Category Name (below image) */}
                <div className="text-center mt-1.5 sm:mt-2 md:mt-3">
                  <h3 className="font-semibold text-[var(--foreground)] text-xs sm:text-sm md:text-base group-hover/category:text-[var(--primary)] transition-colors duration-200 line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5 opacity-0 group-hover/category:opacity-100 transition-opacity duration-200">
                    Shop now →
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Dot Indicators for Mobile */}
      {categories.length > 1 && (
        <div className="flex justify-center gap-1 sm:gap-1.5 mt-2 sm:mt-3 md:hidden">
          {categories.map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                onClick={() => {
                  const container = scrollContainerRef.current;
                  if (container) {
                    const itemWidth = container.scrollWidth / categories.length;
                    const scrollAmount = itemWidth * idx;
                    container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
                  }
                }}
                className={`h-1 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-[var(--primary)] w-3 sm:w-4' 
                    : 'bg-[var(--border)] w-1.5 hover:bg-[var(--primary)]/50'
                }`}
                aria-label={`Go to category ${idx + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
