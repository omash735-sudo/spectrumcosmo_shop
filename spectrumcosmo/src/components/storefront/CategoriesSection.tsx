import Link from 'next/link';
import Image from 'next/image';
import { getDb } from '@/lib/db';
import { FolderOpen } from 'lucide-react';

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
      <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
        {categories.map((cat: any) => (
          <Link
            key={cat.id}
            href={`/products?category=${encodeURIComponent(cat.name)}`}
            className="min-w-[90px] md:min-w-0 flex flex-col items-center gap-1 p-2 bg-white border rounded-xl hover:shadow-md transition group"
          >
            {cat.image_url ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                <Image src={cat.image_url} alt={cat.name} fill className="object-cover group-hover:scale-110 transition" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-[#F97316]">
                <FolderOpen size={24} />
              </div>
            )}
            <span className="text-xs font-medium text-gray-700 text-center line-clamp-1">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
