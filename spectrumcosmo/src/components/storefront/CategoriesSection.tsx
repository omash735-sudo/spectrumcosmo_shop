import Link from 'next/link';
import Image from 'next/image';
import { getDb } from '@/lib/db';

export default async function CategoriesSection() {
  const sql = getDb();
  const categories = await sql`
    SELECT * FROM categories 
    WHERE is_active = true 
    ORDER BY sort_order ASC, name ASC
  `;

  if (categories.length === 0) return null;

  return (
    <div className="mb-8 sm:mb-12">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Shop by Category</h2>
      <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
        {categories.map((cat: any) => (
          <Link
            key={cat.id}
            href={`/products?category=${encodeURIComponent(cat.name)}`}
            className="min-w-[120px] md:min-w-0 bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group"
          >
            <div className="relative h-28 sm:h-32 bg-gray-100">
              {cat.image_url ? (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-orange-50 text-[#F97316] font-semibold">
                  {cat.name}
                </div>
              )}
            </div>
            <div className="p-2 text-center">
              <h3 className="font-medium text-sm">{cat.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
