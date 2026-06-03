// app/products/page.tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import { getDb } from '@/lib/db';
import { Search, ChevronDown, SlidersHorizontal, X, AlertCircle } from 'lucide-react';
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
  searchParams: Promise<{ category?: string; q?: string; page?: string; sort?: string; minPrice?: string; maxPrice?: string }>;
}) {
  try {
    const params = await searchParams;
    const sql = getDb();
    
    const cookieStore = cookies();
    let selectedCategory = params.category;
    if (!selectedCategory && !params.q) {
      const savedCategory = cookieStore.get('last_category')?.value;
      if (savedCategory && savedCategory !== 'All') {
        selectedCategory = savedCategory;
        redirect(`/products?category=${encodeURIComponent(selectedCategory)}`);
      }
    }

    let categories = [];
    try {
      categories = await sql`
        SELECT name, slug FROM categories WHERE is_active = true ORDER BY sort_order ASC
      `;
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      categories = [];
    }
    const categoryNames = ['All', ...categories.map((c: any) => c.name)];

    let products: any[] = [];
    let totalCount = 0;
    const currentPage = parseInt(params.page || '1');
    const pageSize = 12;
    const offset = (currentPage - 1) * pageSize;
    const sortBy = params.sort || 'newest';
    const minPrice = params.minPrice ? parseInt(params.minPrice) : null;
    const maxPrice = params.maxPrice ? parseInt(params.maxPrice) : null;

    try {
      let countQuery, dataQuery;
      let orderClause = '';
      let priceFilter = '';
      
      switch (sortBy) {
        case 'price_low':
          orderClause = 'p.price ASC';
          break;
        case 'price_high':
          orderClause = 'p.price DESC';
          break;
        case 'popular':
          orderClause = 'p.view_count DESC';
          break;
        default:
          orderClause = 'p.created_at DESC';
      }
      
      if (minPrice !== null && maxPrice !== null) {
        priceFilter = `AND p.price BETWEEN ${minPrice} AND ${maxPrice}`;
      } else if (minPrice !== null) {
        priceFilter = `AND p.price >= ${minPrice}`;
      } else if (maxPrice !== null) {
        priceFilter = `AND p.price <= ${maxPrice}`;
      }
      
      if (params.q) {
        if (selectedCategory && selectedCategory !== 'All') {
          countQuery = sql`
            SELECT COUNT(*) as count
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE c.name = ${selectedCategory}
              AND (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
              AND p.status = 'in_stock'
              ${sql.raw(priceFilter)}
          `;
          dataQuery = sql`
            SELECT p.*, c.name as category_name 
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE c.name = ${selectedCategory}
              AND (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
              AND p.status = 'in_stock'
              ${sql.raw(priceFilter)}
            ORDER BY ${sql.raw(orderClause)}
            LIMIT ${pageSize} OFFSET ${offset}
          `;
        } else {
          countQuery = sql`
            SELECT COUNT(*) as count
            FROM products p
            WHERE (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
              AND p.status = 'in_stock'
              ${sql.raw(priceFilter)}
          `;
          dataQuery = sql`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
              AND p.status = 'in_stock'
              ${sql.raw(priceFilter)}
            ORDER BY ${sql.raw(orderClause)}
            LIMIT ${pageSize} OFFSET ${offset}
          `;
        }
      } else {
        if (selectedCategory && selectedCategory !== 'All') {
          countQuery = sql`
            SELECT COUNT(*) as count
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE c.name = ${selectedCategory} AND p.status = 'in_stock'
            ${sql.raw(priceFilter)}
          `;
          dataQuery = sql`
            SELECT p.*, c.name as category_name 
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE c.name = ${selectedCategory} AND p.status = 'in_stock'
            ${sql.raw(priceFilter)}
            ORDER BY ${sql.raw(orderClause)}
            LIMIT ${pageSize} OFFSET ${offset}
          `;
        } else {
          countQuery = sql`
            SELECT COUNT(*) as count
            FROM products p
            WHERE p.status = 'in_stock'
            ${sql.raw(priceFilter)}
          `;
          dataQuery = sql`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'in_stock'
            ${sql.raw(priceFilter)}
            ORDER BY ${sql.raw(orderClause)}
            LIMIT ${pageSize} OFFSET ${offset}
          `;
        }
      }
      const [countResult, productsResult] = await Promise.all([countQuery, dataQuery]);
      totalCount = parseInt(countResult[0]?.count || '0');
      products = productsResult;
    } catch (err) {
      console.error('Products query error:', err);
      products = [];
      totalCount = 0;
    }

    const totalPages = Math.ceil(totalCount / pageSize);
    const getPageUrl = (page: number, sort?: string, minP?: number, maxP?: number) => {
      const urlParams = new URLSearchParams();
      if (params.q) urlParams.set('q', params.q);
      if (selectedCategory && selectedCategory !== 'All') urlParams.set('category', selectedCategory);
      if (sort) urlParams.set('sort', sort);
      else if (params.sort) urlParams.set('sort', params.sort);
      if (minP !== undefined) urlParams.set('minPrice', minP.toString());
      if (maxP !== undefined) urlParams.set('maxPrice', maxP.toString());
      urlParams.set('page', page.toString());
      return `/products?${urlParams.toString()}`;
    };

    const sortOptions = [
      { value: 'newest', label: 'Newest First' },
      { value: 'price_low', label: 'Price: Low to High' },
      { value: 'price_high', label: 'Price: High to Low' },
      { value: 'popular', label: 'Most Popular' },
    ];

    const clearFilters = () => {
      const urlParams = new URLSearchParams();
      if (params.q) urlParams.set('q', params.q);
      if (selectedCategory && selectedCategory !== 'All') urlParams.set('category', selectedCategory);
      if (params.sort) urlParams.set('sort', params.sort);
      return `/products?${urlParams.toString()}`;
    };

    const hasFilters = minPrice !== null || maxPrice !== null;

    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white">
          <HeroCarousel slides={carouselSlides} textColor="#F97316" autoplayDelay={5000} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Featured Products Section with Error Boundary */}
            <div className="mb-16">
              <FeaturedProducts />
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {params.q ? `Search results for "${params.q}"` : selectedCategory && selectedCategory !== 'All' ? selectedCategory : 'All Products'}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {totalCount} {totalCount === 1 ? 'product' : 'products'} found
                </p>
              </div>
              
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  onChange={(e) => {
                    const url = getPageUrl(1, e.target.value, minPrice || undefined, maxPrice || undefined);
                    window.location.href = url;
                  }}
                  defaultValue={sortBy}
                  className="appearance-none bg-white border border-gray-200 rounded-full px-5 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                <span className="text-sm font-medium text-gray-700">Filter by price:</span>
                <form method="GET" action="/products" className="flex items-center gap-2">
                  {params.q && <input type="hidden" name="q" value={params.q} />}
                  {selectedCategory && selectedCategory !== 'All' && <input type="hidden" name="category" value={selectedCategory} />}
                  {params.sort && <input type="hidden" name="sort" value={params.sort} />}
                  <input
                    type="number"
                    name="minPrice"
                    placeholder="Min"
                    defaultValue={minPrice || ''}
                    className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="Max"
                    defaultValue={maxPrice || ''}
                    className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Apply</button>
                </form>
              </div>
              {hasFilters && (
                <Link href={clearFilters()} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                  <X size={12} /> Clear filters
                </Link>
              )}
            </div>

            {/* Categories - Scrollable Tabs */}
            <div className="mb-10">
              <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:overflow-visible md:mx-0 md:px-0">
                <div className="flex gap-2 min-w-max md:flex-wrap md:justify-center">
                  {categoryNames.map((cat) => {
                    const isActive = (!selectedCategory && cat === 'All') || selectedCategory === cat;
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
                    if (minPrice) href += `&minPrice=${minPrice}`;
                    if (maxPrice) href += `&maxPrice=${maxPrice}`;
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
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <nav className="flex items-center gap-2">
                      {currentPage > 1 && (
                        <a
                          href={getPageUrl(currentPage - 1, sortBy, minPrice || undefined, maxPrice || undefined)}
                          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-orange-200 transition"
                        >
                          Previous
                        </a>
                      )}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <a
                              key={pageNum}
                              href={getPageUrl(pageNum, sortBy, minPrice || undefined, maxPrice || undefined)}
                              className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition ${
                                currentPage === pageNum
                                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </a>
                          );
                        })}
                      </div>
                      {currentPage < totalPages && (
                        <a
                          href={getPageUrl(currentPage + 1, sortBy, minPrice || undefined, maxPrice || undefined)}
                          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-orange-200 transition"
                        >
                          Next
                        </a>
                      )}
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  } catch (error: any) {
    // ERROR HANDLER - This will show the error on the page instead of crashing
    console.error('Products page error:', error);
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white py-20">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={24} className="text-red-600" />
                <h2 className="text-xl font-bold text-red-800">Something went wrong</h2>
              </div>
              <p className="text-red-700 mb-3 font-mono text-sm break-all">{error.message}</p>
              <pre className="bg-white p-3 rounded-lg text-xs overflow-auto max-h-60 mb-4">
                {error.stack}
              </pre>
              <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                <p className="font-bold text-sm mb-2">📋 Copy this and send to developer:</p>
                <code className="text-xs block break-all">
                  Error: {error.message}<br />
                  Stack: {error.stack?.substring(0, 500)}
                </code>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
}
