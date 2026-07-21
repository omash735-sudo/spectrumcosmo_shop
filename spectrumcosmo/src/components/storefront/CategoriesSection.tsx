import Link from 'next/link';
import Image from 'next/image';
import { getDb, queryMany } from '@/lib/db';
import { FolderOpen, ArrowRight } from 'lucide-react'; // <-- Removed Sparkles

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
}

export default async function CategoriesSection() {
  const sql = getDb();
  
  const categories = await queryMany<Category>`
    SELECT 
      c.id, 
      c.name, 
      c.slug, 
      c.image_url, 
      c.is_active, 
      c.sort_order,
      COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.status = 'in_stock'
    WHERE c.is_active = true 
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `;
  
  if (categories.length === 0) return null;

  return (
    <div className="relative px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1 h-5 sm:h-6 md:h-7 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
          <h2 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 dark:text-white">Shop by Category</h2>
          {/* <Sparkles size={14} className="text-orange-400 hidden sm:block sm:w-4 sm:h-4 md:w-5 md:h-5" /> */} {/* REMOVED */}
        </div>
        <Link 
          href="/products" 
          className="text-xs md:text-sm text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 font-medium flex items-center gap-1 group"
        >
          View all
          <ArrowRight size={12} className="md:w-[14px] md:h-[14px] group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${encodeURIComponent(category.name)}`}
            className="group block touch-manipulation"
          >
            {/* Image Container */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-sm group-hover:shadow-xl transition-all duration-300">
              <div className="relative aspect-square overflow-hidden">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30">
                    <FolderOpen size={24} className="text-orange-400 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </div>
                )}
                
                {/* Gradient Overlay - Desktop only */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block" />
                
                {/* Shop Now Overlay - Desktop only */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 hidden md:flex">
                  <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold shadow-lg flex items-center gap-1">
                    Shop <ArrowRight size={10} className="sm:w-3 sm:h-3" />
                  </span>
                </div>
              </div>
            </div>
            
            {/* Category Info */}
            <div className="text-center mt-1.5 sm:mt-2 md:mt-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-[11px] sm:text-xs md:text-sm lg:text-base group-hover:text-orange-500 transition-colors line-clamp-1">
                {category.name}
              </h3>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {category.product_count || 0} items
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
