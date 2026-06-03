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
    <div className="relative">
      {/* Header with accent */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-1 h-7 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Shop by Category</h2>
          <Sparkles size={18} className="text-orange-400" />
        </div>
        <Link 
          href="/products" 
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 group"
        >
          View all categories
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${encodeURIComponent(category.name)}`}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm group-hover:shadow-xl transition-all duration-300">
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                    <FolderOpen size={40} className="text-orange-400" />
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Shop Now Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                  <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
                    Shop Now <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
            
            {/* Category Info */}
            <div className="text-center mt-3">
              <h3 className="font-semibold text-gray-800 text-sm md:text-base group-hover:text-orange-500 transition-colors">
                {category.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {category.product_count || 0} products
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
