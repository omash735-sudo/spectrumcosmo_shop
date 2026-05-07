import Link from 'next/link';
import Image from 'next/image';
import { getDb } from '@/lib/db';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';

export default async function FeaturedProducts() {
  const sql = getDb();
  const featured = await sql`SELECT * FROM products ORDER BY created_at DESC LIMIT 4`;

  if (featured.length === 0) return null;

  return (
    <div className="mb-8 sm:mb-12">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">🔥 Featured Products</h2>
        <Link href="/products" className="text-xs sm:text-sm text-[#F97316] hover:underline">
          See all →
        </Link>
      </div>
      <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
        {featured.map((product: any) => (
          <div key={product.id} className="min-w-[160px] md:min-w-0 bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
            <Link href={`/products/${product.id}`}>
              <div className="relative h-32 sm:h-40 bg-gray-100">
                <Image
                  src={product.image_url || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                <span className="absolute top-2 left-2 bg-[#F97316] text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded">
                  Featured
                </span>
              </div>
              <div className="p-2 sm:p-3">
                <h3 className="font-semibold text-xs sm:text-sm line-clamp-1">{product.name}</h3>
                <div className="mt-1 text-[#F97316] font-bold text-sm sm:text-base">
                  <CurrencyPrice amountUsd={Number(product.price)} />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
