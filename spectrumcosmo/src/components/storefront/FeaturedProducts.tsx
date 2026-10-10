'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight as ArrowRight } from 'lucide-react';
import ProductCard from '@/components/storefront/ProductCard';

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  image_url: string;
  status?: string;
  stock_quantity?: number;
  category_name?: string;
  avg_rating?: number;
  review_count?: number;
}

// In the installed app there is no server inside the app, so a relative
// "/api/..." URL points at the app itself. Same base ProductService uses.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Two rows on mobile (2 columns), one row on desktop (4 columns).
const MAX_ITEMS = 4;

export default function FeaturedProducts() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/featured`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setProducts(data);
      } catch {
        console.warn('Featured products unavailable');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <div className="w-1 h-5 sm:h-6 md:h-8 bg-gradient-to-t from-[var(--primary)] to-[var(--primary-hover)] rounded-full" />
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--foreground)]">
              Featured Products
            </h2>
            <p className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-muted)] mt-0.5">
              Handpicked just for you
            </p>
          </div>
        </div>
        <Link
          href="/products"
          className="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium flex items-center gap-0.5 sm:gap-1 group"
        >
          View all
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Same card as the rest of the shop: price, discount, wishlist,
          Add to Cart and Buy Now all work straight from here. */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {products.slice(0, MAX_ITEMS).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
