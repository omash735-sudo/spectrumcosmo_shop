'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FolderOpen, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
  const [showRightButton, setShowRightButton] useState(false);

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
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 280;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="mb-8 sm:mb-12 lg:mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1 h-5 sm:h-7 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Shop by Category</h2>
          <Sparkles size={14} className="text-orange-400 sm:w-[18px] sm:h-[18px]" />
        </div>
        <Link 
          href="/products" 
          className="text-xs sm:text-sm text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 font-medium flex items-center gap-1 group"
        >
          View all
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform sm:w-4 sm:h-4" />
        </Link>
      </div>

      {/* Categories Carousel */}
      <div className="relative group">
        {/* Left Navigation Button */}
        {showLeftButton && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-3 z-10 bg-white dark:bg-gray-800 rounded-full p-2 sm:p-2.5 shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}
        
        {/* Right Navigation Button */}
        {showRightButton && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-3 z-10 bg-white dark:bg-gray-800 rounded-full p-2 sm:p-2.5 shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}

        {/* Scrollable Categories Grid */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-3 sm:gap-4 pb-3 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat, index) => (
            <Link
              key={cat.id}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group/category flex-shrink-0 w-[90px] sm:w-[110px] md:w-[130px] snap-start transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative">
                {/* Image Container */}
                <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-sm group-hover/category:shadow-xl transition-all duration-300">
                  {cat.image_url ? (
                    <Image
                      src={cat.image_url}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover/category:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30">
                      <FolderOpen size={24} className="text-orange-400 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/category:opacity-100 transition-opacity duration-300" />
                  
                  {/* Category Name Overlay (visible on hover) */}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 md:p-3 transform translate-y-full group-hover/category:translate-y-0 transition-transform duration-300">
                    <span className="block text-white text-[10px] sm:text-xs font-semibold text-center truncate">
                      Shop {cat.name} →
                    </span>
                  </div>
                </div>
                
                {/* Category Name (below image) */}
                <div className="text-center mt-2 sm:mt-3">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm md:text-base group-hover/category:text-orange-500 transition-colors duration-200">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 opacity-0 group-hover/category:opacity-100 transition-opacity duration-200">
                    Shop now →
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Dot Indicators for Mobile */}
      <div className="flex justify-center gap-1.5 mt-3 sm:mt-4 md:hidden">
        {categories.map((_, idx) => {
          const container = scrollContainerRef.current;
          const isActive = container 
            ? Math.abs(container.scrollLeft / (container.scrollWidth / categories.length)) >= idx - 0.5 &&
              Math.abs(container.scrollLeft / (container.scrollWidth / categories.length)) < idx + 0.5
            : idx === 0;
          return (
            <button
              key={idx}
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  const scrollAmount = (container.scrollWidth / categories.length) * idx;
                  container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
                }
              }}
              className={`h-1 rounded-full transition-all duration-300 ${
                isActive ? 'bg-orange-500 w-3 sm:w-4' : 'bg-gray-300 dark:bg-gray-600 w-1.5 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
