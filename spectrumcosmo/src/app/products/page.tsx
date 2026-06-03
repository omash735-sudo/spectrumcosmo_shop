export const dynamic = 'force-dynamic';

import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import { getDb } from '@/lib/db';
import { Search, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const carouselSlides = [
  {
    id: 1,
    image: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1778101210/pc97xdh08ivrbtvdzins.jpg',
    title: 'Anime Mugs',
    subtitle: 'Up to 30% off • Sip in style',
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1775346088/WhatsApp_Image_2026-04-03_at_16.15.20_bgw3gq.jpg',
    title: 'Exclusive Posters',
    subtitle: 'Limited collection • 20% off',
  },
  {
    id: 3,
    image: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1775339426/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
    title: 'Signature Bracelets',
    subtitle: 'Complete your look • Free shipping',
  },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const sql = getDb();

  let categories = [];
  try {
    categories = await sql`
      SELECT name, slug FROM categories WHERE is_active = true ORDER BY sort_order ASC
    `;
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }
  const categoryNames = ['All', ...categories.map((c: any) => c.name)];

  let products: any[] = [];
  try {
    let baseQuery;

    if (params.q) {
      baseQuery = sql`
        SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
          AND p.status = 'in_stock'
        ORDER BY p.created_at DESC
      `;
    } else {
      baseQuery = sql`
        SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'in_stock'
        ORDER BY p.created_at DESC
      `;
    }

    if (params.category && params.category !== 'All') {
      if (params.q) {
        baseQuery = sql`
          SELECT p.*, c.name as category_name 
          FROM products p
          JOIN categories c ON p.category_id = c.id
          WHERE c.name = ${params.category}
            AND (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
            AND p.status = 'in_stock'
          ORDER BY p.created_at DESC
        `;
      } else {
        baseQuery = sql`
          SELECT p.*, c.name as category_name 
          FROM products p
          JOIN categories c ON p.category_id = c.id
          WHERE c.name = ${params.category} AND p.status = 'in_stock'
          ORDER BY p.created_at DESC
        `;
      }
    }
    products = await baseQuery;
  } catch (err) {
    console.error('Products query error:', err);
    products = [];
  }

  const clearFilters = () => {
    const urlParams = new URLSearchParams();
    if (params.q) urlParams.set('q', params.q);
    return `/products?${urlParams.toString()}`;
  };

  const hasFilters = params.category && params.category !== 'All';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <HeroCarousel slides={carouselSlides} textColor="#F97316" autoplayDelay={5000} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Featured Products Section */}
          <FeaturedProducts />

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {params.q ? `Search results for "${params.q}"` : params.category && params.category !== 'All' ? params.category : 'All Products'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <form method="GET" action="/products" className="relative max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q || ''}
                  placeholder="Search for anime merch, apparel, accessories..."
                  className="w-full border border-gray-200 rounded-2xl py-4 pl-6 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-md"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
              </div>
              {params.q && (
                <div className="text-center mt-3">
                  <Link href={clearFilters()} className="text-sm text-orange-500 hover:text-orange-600">
                    Clear search
                  </Link>
                </div>
              )}
            </form>
          </div>

          {/* Filter Bar - Simplified */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
              {params.category && params.category !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
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

          {/* Categories - Premium Tabs */}
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
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your search or browse our categories.</p>
              <Link href="/products" className="inline-block mt-4 text-orange-500 hover:text-orange-600 font-medium">
                View all products →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
