export const dynamic = 'force-dynamic';

import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import { getDb } from '@/lib/db';
import { Search } from 'lucide-react';

const CATEGORIES = ['All', 'T-Shirts', 'Hoodies', 'Pendants', 'Bracelets'];

// Carousel slides with orange titles
const carouselSlides = [
  {
    id: 1,
    image: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1778101210/pc97xdh08ivrbtvdzins.jpg',
    title: 'Anime Mugs',
    subtitle: 'Sip in style',
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1775346088/WhatsApp_Image_2026-04-03_at_16.15.20_bgw3gq.jpg',
    title: 'Exclusive Posters',
    subtitle: 'Limited collection',
  },
  {
    id: 3,
    image: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1775339426/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
    title: 'Signature Bracelets',
    subtitle: 'Complete your look',
  },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  let products: any[] = [];
  try {
    const sql = getDb();
    let baseQuery = params.q
      ? sql`SELECT * FROM products WHERE name ILIKE ${'%' + params.q + '%'} ORDER BY created_at DESC`
      : sql`SELECT * FROM products ORDER BY created_at DESC`;

    if (params.category && params.category !== 'All') {
      baseQuery = sql`SELECT * FROM products WHERE category=${params.category} ORDER BY created_at DESC`;
      if (params.q) {
        baseQuery = sql`SELECT * FROM products WHERE category=${params.category} AND name ILIKE ${'%' + params.q + '%'} ORDER BY created_at DESC`;
      }
    }
    products = await baseQuery;
  } catch (err) {
    console.error(err);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <HeroCarousel slides={carouselSlides} textColor="#F97316" autoplayDelay={5000} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Search Bar */}
          <div className="mb-8">
            <form method="GET" action="/products" className="relative max-w-md mx-auto">
              <input
                type="text"
                name="q"
                defaultValue={params.q || ''}
                placeholder="Search products..."
                className="w-full border border-gray-200 rounded-full py-3 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#F97316] text-white p-2 rounded-full hover:bg-orange-600 transition"
              >
                <Search size={18} />
              </button>
            </form>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {CATEGORIES.map((cat) => {
              const isActive = (!params.category && cat === 'All') || params.category === cat;
              const href = params.q
                ? cat === 'All'
                  ? `/products?q=${encodeURIComponent(params.q)}`
                  : `/products?category=${cat}&q=${encodeURIComponent(params.q)}`
                : cat === 'All'
                ? '/products'
                : `/products?category=${cat}`;
              return (
                <a
                  key={cat}
                  href={href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
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

          {products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-400 text-lg">No products found.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-6">
                {products.length} product{products.length !== 1 ? 's' : ''} found
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
