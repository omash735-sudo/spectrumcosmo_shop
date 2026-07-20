// app/products/page.tsx
export const revalidate = 60;

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import { getDb, queryMany } from '@/lib/db';
import { Search, SlidersHorizontal, X } from 'lucide-react';

// Types
interface Category {
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  currency: string;
  image_url: string | null;
  category_id: string | null;
  status: string;
  stock_quantity: number;
  is_featured: boolean;
  sku: string | null;
  created_at: Date;
  category_name?: string;
}

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  image_url: string;
  status?: string;
  stock_quantity?: number;
  category_name?: string;
  category?: string;
  description?: string;
}

function toProductCardProps(product: Product): ProductCardProps {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    compare_price: product.compare_price ?? undefined,
    image_url: product.image_url ?? '',
    status: product.status,
    stock_quantity: product.stock_quantity,
    category_name: product.category_name,
    description: product.description ?? undefined,
  };
}

const heroSettings = {
  titleColor: '#FFFFFF',
  subtitleColor: '#FFFFFF',
  titleAlignment: 'center' as const,
  subtitleAlignment: 'center' as const,
  verticalPosition: 'bottom' as const,
  buttonBgColor: '#C96712',
  buttonTextColor: '#FFFFFF',
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const sql = getDb();

  let categories: Category[] = [];
  try {
    categories = await queryMany<Category>`
      SELECT name, slug FROM categories WHERE is_active = true ORDER BY sort_order ASC
    `;
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }
  const categoryNames = ['All', ...categories.map((c) => c.name)];

  let products: Product[] = [];
  try {
    let query;
    if (params.q && params.category && params.category !== 'All') {
      query = queryMany<Product>`
        SELECT p.*, c.name as category_name 
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE c.name = ${params.category}
          AND (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
          AND p.status = 'in_stock'
        ORDER BY p.created_at DESC
      `;
    } else if (params.q) {
      query = queryMany<Product>`
        SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
          AND p.status = 'in_stock'
        ORDER BY p.created_at DESC
      `;
    } else if (params.category && params.category !== 'All') {
      query = queryMany<Product>`
        SELECT p.*, c.name as category_name 
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE c.name = ${params.category} AND p.status = 'in_stock'
        ORDER BY p.created_at DESC
      `;
    } else {
      query = queryMany<Product>`
        SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'in_stock'
        ORDER BY p.created_at DESC
      `;
    }
    products = await query;
  } catch (err) {
    console.error('Products query error:', err);
    products = [];
  }

  const productCardProps = products.map(toProductCardProps);

  const clearFilters = () => {
    const urlParams = new URLSearchParams();
    if (params.q) urlParams.set('q', params.q);
    return `/products?${urlParams.toString()}`;
  };

  const hasFilters = params.category && params.category !== 'All';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)]">
        
        {/* HERO CAROUSEL - No manga panel */}
        <HeroCarousel
          titleColor={heroSettings.titleColor}
          subtitleColor={heroSettings.subtitleColor}
          titleAlignment={heroSettings.titleAlignment}
          subtitleAlignment={heroSettings.subtitleAlignment}
          verticalPosition={heroSettings.verticalPosition}
          buttonBgColor={heroSettings.buttonBgColor}
          buttonTextColor={heroSettings.buttonTextColor}
        />

        {/* FEATURED PRODUCTS - No manga panel, just background color */}
        <div className="bg-[var(--background-secondary)] py-8 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FeaturedProducts />
          </div>
        </div>

        {/* PRODUCTS GRID - With manga panel */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 manga-bg hero-manga">
          <div className="relative z-10">
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 border-b border-[var(--border)]">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
                  {params.q ? `Search results for "${params.q}"` : params.category && params.category !== 'All' ? params.category : 'All Products'}
                </h1>
                <p className="text-[var(--foreground-muted)] text-sm mt-1">
                  {productCardProps.length} {productCardProps.length === 1 ? 'product' : 'products'} found
                </p>
              </div>
            </div>

            <div className="mb-8">
              <form method="GET" action="/products" className="relative max-w-2xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    name="q"
                    defaultValue={params.q || ''}
                    placeholder="Search for anime merch, apparel, accessories..."
                    className="w-full border border-[var(--border)] bg-[var(--background-card)] rounded-2xl py-4 pl-6 pr-14 text-base text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent shadow-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white p-2.5 rounded-xl transition shadow-md"
                    aria-label="Search"
                  >
                    <Search size={18} />
                  </button>
                </div>
                {params.q && (
                  <div className="text-center mt-3">
                    <Link href={clearFilters()} className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">
                      Clear search
                    </Link>
                  </div>
                )}
              </form>
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[var(--foreground-muted)]" />
                <span className="text-sm font-medium text-[var(--foreground-muted)]">Filters:</span>
                {params.category && params.category !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs">
                    Category: {params.category}
                    <Link href={clearFilters()} className="hover:text-red-500">
                      <X size={12} />
                    </Link>
                  </span>
                )}
              </div>
              {hasFilters && (
                <Link href={clearFilters()} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                  <X size={12} /> Clear all filters
                </Link>
              )}
            </div>

            <div className="mb-10">
              <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:overflow-visible md:mx-0 md:px-0">
                <div className="flex gap-2 min-w-max md:flex-wrap md:justify-center">
                  {categoryNames.map((cat) => {
                    const isActive = (!params.category && cat === 'All') || params.category === cat;
                    let href;
                    if (params.q) {
                      href = cat === 'All'
                        ? `/products?q=${encodeURIComponent(params.q)}`
                        : `/products?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(params.q)}`;
                    } else {
                      href = cat === 'All'
                        ? '/products'
                        : `/products?category=${encodeURIComponent(cat)}`;
                    }
                    return (
                      <a
                        key={cat}
                        href={href}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                          isActive
                            ? 'bg-[var(--primary)] text-white shadow-md shadow-orange-200 dark:shadow-none'
                            : 'bg-[var(--background-card)] text-[var(--foreground-muted)] hover:bg-[var(--border)]'
                        }`}
                      >
                        {cat}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {productCardProps.length === 0 ? (
              <div className="text-center py-20 bg-[var(--background-card)] rounded-2xl border border-[var(--border)]">
                <div className="w-20 h-20 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-[var(--foreground-muted)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No products found</h3>
                <p className="text-[var(--foreground-muted)]">Try adjusting your search or browse our categories.</p>
                <Link href="/products" className="inline-block mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium">
                  View all products →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {productCardProps.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
