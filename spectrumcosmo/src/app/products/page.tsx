export const dynamic = 'force-dynamic';

import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import { getDb } from '@/lib/db';

const CATEGORIES = ['All', 'T-Shirts', 'Hoodies', 'Pendants', 'Bracelets'];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  let products: any[] = [];
  try {
    const sql = getDb();
    products = params.category && params.category !== 'All'
      ? await sql`SELECT * FROM products WHERE category=${params.category} ORDER BY created_at DESC`
      : await sql`SELECT * FROM products ORDER BY created_at DESC`;
  } catch (err) {
    console.error(err);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Carousel – replaces old orange section */}
        <HeroCarousel />

        {/* Rest of the page */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Category filters – responsive wrapper */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {CATEGORIES.map(cat => {
              const isActive = (!params.category && cat === 'All') || params.category === cat;
              return (
                <a
                  key={cat}
                  href={cat === 'All' ? '/products' : `/products?category=${cat}`}
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

          {/* Products grid */}
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
