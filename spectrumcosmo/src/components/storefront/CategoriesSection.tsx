'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { FolderOpen, ArrowRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiFetch('/api/public/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);
  }, []);

  if (categories.length === 0) return null;

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <span className="inline-block text-[var(--primary)] text-[11px] md:text-xs font-kanit font-bold uppercase tracking-[0.18em] mb-1.5">
            Browse
          </span>
          <h2 className="font-anton text-2xl md:text-3xl lg:text-4xl text-[var(--foreground)] leading-tight tracking-wide uppercase">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${encodeURIComponent(category.name)}`}
            className="group block"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--background-secondary)] border border-[var(--border)] transition-all duration-300 group-hover:border-[var(--primary)]/40 group-hover:shadow-lg">
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5">
                  <FolderOpen size={28} className="text-[var(--primary)]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="mt-3 text-center">
              <h3 className="font-kanit font-semibold text-[var(--foreground)] text-sm sm:text-base group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                {category.name}
              </h3>
              {category.product_count > 0 && (
                <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                  {category.product_count} items
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
