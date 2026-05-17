'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="mb-8 sm:mb-12 relative">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Shop by Category</h2>
      
      {showLeftButton && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md border border-gray-200 hidden md:flex lg:hidden"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {showRightButton && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md border border-gray-200 hidden md:flex lg:hidden"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:mx-0 md:px-0"
      >
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${encodeURIComponent(cat.name)}`}
            className="min-w-[90px] md:min-w-0 flex flex-col items-center gap-1 p-2 bg-white border rounded-xl hover:shadow-md transition group"
          >
            {cat.image_url ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                <Image 
                  src={cat.image_url} 
                  alt={cat.name} 
                  fill 
                  className="object-cover group-hover:scale-110 transition" 
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-[#F97316]">
                <FolderOpen size={24} />
              </div>
            )}
            <span className="text-xs font-medium text-gray-700 text-center line-clamp-1">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
