export const dynamic = 'force-dynamic';

import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import { getDb } from '@/lib/db';
import { Search } from 'lucide-react';
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
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const sql = getDb();
  
  // Get category from URL or from saved cookie
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
  }
  const categoryNames = ['All', ...categories.map((c: any) => c.name)];

  // Product fetching logic (unchanged)
  let products: any[] = [];
  let totalCount = 0;
  const currentPage = parseInt(params.page || '1');
  const pageSize = 12;
  const offset = (currentPage - 1) * pageSize;

  try {
    let countQuery, dataQuery;
    if (params.q) {
      // Search query (same as before)
      if (selectedCategory && selectedCategory !== 'All') {
        countQuery = sql`
          SELECT COUNT(*) as count
          FROM products p
          JOIN categories c ON p.category_id = c.id
          WHERE c.name = ${selectedCategory}
            AND (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
            AND p.status = 'in_stock'
        `;
        dataQuery = sql`
          SELECT p.*, c.name as category_name 
          FROM products p
          JOIN categories c ON p.category_id = c.id
          WHERE c.name = ${selectedCategory}
            AND (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
            AND p.status = 'in_stock'
          ORDER BY 
            CASE 
              WHEN p.name ILIKE ${params.q + '%'} THEN 1
              WHEN p.name ILIKE ${'%' + params.q + '%'} THEN 2
              ELSE 3
            END
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      } else {
        countQuery = sql`
          SELECT COUNT(*) as count
          FROM products p
          WHERE (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
            AND p.status = 'in_stock'
        `;
        dataQuery = sql`
          SELECT p.*, c.name as category_name 
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE (p.name ILIKE ${'%' + params.q + '%'} OR p.description ILIKE ${'%' + params.q + '%'})
            AND p.status = 'in_stock'
          ORDER BY 
            CASE 
              WHEN p.name ILIKE ${params.q + '%'} THEN 1
              WHEN p.name ILIKE ${'%' + params.q + '%'} THEN 2
              ELSE 3
            END
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      }
    } else {
      // Regular category browse
      if (selectedCategory && selectedCategory !== 'All') {
        countQuery = sql`
          SELECT COUNT(*) as count
          FROM products p
          JOIN categories c ON p.category_id = c.id
          WHERE c.name = ${selectedCategory} AND p.status = 'in_stock'
        `;
        dataQuery = sql`
          SELECT p.*, c.name as category_name 
          FROM products p
          JOIN categories c ON p.category_id = c.id
          WHERE c.name = ${selectedCategory} AND p.status = 'in_stock'
          ORDER BY p.created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      } else {
        countQuery = sql`
          SELECT COUNT(*) as count
          FROM products p
          WHERE p.status = 'in_stock'
        `;
        dataQuery = sql`
          SELECT p.*, c.name as category_name 
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.status = 'in_stock'
          ORDER BY p.created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;
      }
    }
    const [countResult, productsResult] = await Promise.all([countQuery, dataQuery]);
    totalCount = parseInt(countResult[0]?.count || '0');
    products = productsResult;
  } catch (err) {
    console.error(err);
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const getPageUrl = (page: number) => {
    const urlParams = new URLSearchParams();
    if (params.q) urlParams.set('q', params.q);
    if (selectedCategory && selectedCategory !== 'All') urlParams.set('category', selectedCategory);
    urlParams.set('page', page.toString());
    return `/products?${urlParams.toString()}`;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <HeroCarousel slides={carouselSlides} textColor="#F97316" autoplayDelay={5000} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <FeaturedProducts />

          {/* Search Bar */}
          <div className="mb-8 sm:mb-10">
            <form method="GET" action="/products" className="relative max-w-md mx-auto">
              <input
                type="text"
                name="q"
                defaultValue={params.q || ''}
                placeholder="Search products..."
                className="w-full border border-gray-200 rounded-full py-3 sm:py-3.5 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent text-sm sm:text-base"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#F97316] text-white p-2 rounded-full hover:bg-orange-600 transition"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
            </form>
          </div>

          {/* Category Filter – now scrollable horizontally on mobile */}
          <div className="mb-8 sm:mb-10">
            <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:overflow-visible md:mx-0 md:px-0">
              <div className="flex gap-2 sm:gap-3 min-w-max md:flex-wrap md:justify-center">
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
                  return (
                    <a
                      key={cat}
                      href={href}
                      className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium whitespace-nowrap transition ${
                        isActive
                          ? 'bg-[#F97316] text-white shadow-md hover:bg-orange-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-[#F97316]'
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
            <div className="text-center py-16">
              <p className="text-gray-400 text-base">No products found.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                  Showing {offset + 1}-{Math.min(offset + pageSize, totalCount)} of {totalCount} products
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10 flex-wrap">
                  {currentPage > 1 && (
                    <a
                      href={getPageUrl(currentPage - 1)}
                      className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
                    >
                      Previous
                    </a>
                  )}
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
                        href={getPageUrl(pageNum)}
                        className={`px-4 py-2 border rounded-lg text-sm transition ${
                          currentPage === pageNum
                            ? 'bg-[#F97316] text-white border-[#F97316]'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </a>
                    );
                  })}
                  {currentPage < totalPages && (
                    <a
                      href={getPageUrl(currentPage + 1)}
                      className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
                    >
                      Next
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
