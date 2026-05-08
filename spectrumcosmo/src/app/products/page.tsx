export const dynamic = 'force-dynamic';

import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import { getDb } from '@/lib/db';
import { Search } from 'lucide-react';

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
    console.error(err);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <HeroCarousel slides={carouselSlides} textColor="#F97316" autoplayDelay={5000} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <FeaturedProducts />

          <div className="mb-6 sm:mb-8">
            <form method="GET" action="/products" className="relative max-w-md mx-auto">
              <input
                type="text"
                name="q"
                defaultValue={params.q || ''}
                placeholder="Search products..."
                className="w-full border border-gray-200 rounded-full py-2.5 sm:py-3 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F97316] text-white p-1.5 sm:p-2 rounded-full hover:bg-orange-600 transition"
              >
                <Search size={16} />
              </button>
            </form>
          </div>

          <div className="overflow-x-auto pb-2 -mx-4 px-4 mb-6 sm:mb-8 md:mx-0 md:px-0 md:overflow-visible">
            <div className="flex gap-2 min-w-max md:flex-wrap md:justify-center">
              {categoryNames.map((cat) => {
                const isActive = (!params.category && cat === 'All') || params.category === cat;
                const href = params.q
                  ? cat === 'All'
                    ? `/products?q=${encodeURIComponent(params.q)}`
                    : `/products?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(params.q)}`
                  : cat === 'All'
                  ? '/products'
                  : `/products?category=${encodeURIComponent(cat)}`;
                return (
                  <a
                    key={cat}
                    href={href}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                      isActive
                        ? 'bg-[#F97316] text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-[#F97316]'
                    }`}
                  >
                    {cat}
                  </a>
                );
              })}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-base">No products found.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-400">
                  {products.length} product{products.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
