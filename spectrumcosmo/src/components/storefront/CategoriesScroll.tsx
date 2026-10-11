'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FolderOpen, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

type Category = {
  id: number | string;
  name: string;
  slug: string;
  image_url?: string | null;
  is_active: boolean;
  sort_order: number;
  product_count?: number;
};

export default function CategoriesScroll({ categories }: { categories: Category[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 8);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75,
      behavior: 'smooth',
    });
  };

  if (!categories?.length) return null;

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
        <div>
          <span className="inline-block text-[var(--primary)] text-[11px] md:text-xs font-kanit font-bold uppercase tracking-[0.18em] mb-1.5">
            Browse
          </span>
          <h2 className="font-anton text-2xl md:text-3xl text-[var(--foreground)] leading-tight tracking-wide uppercase">
            Shop by Category
          </h2>
        </div>
        <Link
          href="/products"
          className="group inline-flex items-center gap-1.5 shrink-0 font-heading font-semibold text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
        >
          View All
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="relative">
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-[var(--background-card)] border border-[var(--border)] shadow-md hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {showRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-[var(--background-card)] border border-[var(--border)] shadow-md hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group flex-shrink-0 w-[110px] sm:w-[130px] md:w-[150px] snap-start"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--background-secondary)] border border-[var(--border)] transition-all duration-300 group-hover:border-[var(--primary)]/40 group-hover:shadow-lg">
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="150px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5">
                    <FolderOpen size={26} className="text-[var(--primary)]" />
                  </div>
                )}
              </div>
              <div className="mt-2.5 text-center">
                <h3 className="font-kanit font-semibold text-[var(--foreground)] text-sm group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                {typeof cat.product_count === 'number' && cat.product_count > 0 && (
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    {cat.product_count} items
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
