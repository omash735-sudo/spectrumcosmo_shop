// app/products/page.tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
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

// Static banner image (first slide)
const bannerImage = 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1778101210/pc97xdh08ivrbtvdzins.jpg';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const sql = getDb();

  // Fetch categories
  let categories: Category[] = [];
  try {
    categories = await queryMany<Category>`
      SELECT name, slug FROM categories WHERE is_active = true ORDER BY sort_order ASC
    `;
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }
  const categoryNames = ['All', ...categories.map((c) => c.name)];

  // Fetch products based on filters
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
        {/* Simple Hero Banner – no external component, safe JSX */}
        <div className="relative h-[400px] w-full overflow-hidden">
          <Image
            src={bannerImage}
            alt="Hero banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-3xl md:text-5xl font-bold mb-2">Anime Mugs</h1>
              <p className="text-lg md:text-xl">Up to 30% off • Sip in style</p>
            </div>
          </div>
        </div>

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

          {/* Filter Bar */}
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

          {/* Categories Tabs */}
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
              {products.map((product) => (
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
