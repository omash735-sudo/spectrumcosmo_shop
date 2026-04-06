import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

export default function ProductCard({ product }: { product: any }) {
  const isAvailable = !product.status || product.status === 'in_stock'
  const isSold = product.status === 'sold'
  const isComingSoon = product.status === 'coming_soon'

  return (
    <div className="card group overflow-hidden">
      <div className="relative h-64 overflow-hidden bg-gray-50">
        <Image
          src={product.image_url || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        {/* Category badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-600 px-2.5 py-1 rounded-full">
            {product.category}
          </span>
        </div>
        {/* Status overlays */}
        {isSold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white font-bold px-4 py-2 rounded-full text-sm tracking-wide">
              SOLD OUT
            </span>
          </div>
        )}
        {isComingSoon && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-blue-500 text-white font-bold px-4 py-2 rounded-full text-sm tracking-wide">
              COMING SOON
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3
          className="font-bold text-lg text-[#111111] mb-1 leading-snug"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-[#F97316]">
              {product.currency || 'MWK'} {parseFloat(product.price).toLocaleString()}
            </span>
          </div>
          <Link
            href={isAvailable ? `/products/${product.id}` : '#'}
            className={`btn-primary text-sm py-2 px-4 ${!isAvailable ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ShoppingCart size={15} />
            {isSold ? 'Sold Out' : isComingSoon ? 'Coming Soon' : 'Order'}
          </Link>
        </div>
      </div>
    </div>
  )
}
