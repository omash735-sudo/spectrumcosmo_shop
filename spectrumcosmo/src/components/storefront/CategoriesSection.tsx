import Link from 'next/link';
import Image from 'next/image';
import { getDb } from '@/lib/db';
import { FolderOpen, ArrowRight, Sparkles } from 'lucide-react';

export default async function CategoriesSection() {
  const sql = getDb();
  const categories = await sql`
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
      {/* Header - Mobile Optimized */}
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 md:h-7 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900">Shop by Category</h2>
          <Sparkles size={16} className="text-orange-400 hidden sm:block" />
        </div>
        <Link 
          href="/products" 
          className="text-xs md:text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 group"
        >
          View all
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Categories Grid - Mobile First (2 columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${encodeURIComponent(category.name)}`}
            className="group block touch-manipulation"
          >
            {/* Image Container - Touch friendly size */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm group-hover:shadow-xl transition-all duration-300">
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
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                    <FolderOpen size={28} className="text-orange-400 sm:size-8" />
                  </div>
                )}
                
                {/* Gradient Overlay - Desktop only */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block" />
                
                {/* Shop Now Overlay - Desktop only */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 hidden md:flex">
                  <span className="bg-white text-gray-900 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                    Shop <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </div>
            
            {/* Category Info - Mobile friendly touch target */}
            <div className="text-center mt-2 sm:mt-3">
              <h3 className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base group-hover:text-orange-500 transition-colors line-clamp-1">
                {category.name}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                {category.product_count || 0} items
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
