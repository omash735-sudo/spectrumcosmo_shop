'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Plus } from 'lucide-react'
import CurrencyPrice from '@/components/storefront/CurrencyPrice'
import { useCart } from '@/components/storefront/CartProvider'
export default function ProductCard({ product }: { product: any }) {
  const priceUsd = Number(product.price ?? 0)
  const { addItem } = useCart()

  return (
    <div className="card group overflow-hidden">
      <div className="relative h-64 overflow-hidden bg-gray-50">
        <Image src={product.image_url||'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600'} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" />
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-600 px-2.5 py-1 rounded-full">{product.category}</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg text-[#111111] mb-1 leading-snug" style={{fontFamily:'var(--font-display)'}}>{product.name}</h3>
        {product.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{product.description}</p>}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-[#F97316]"><CurrencyPrice amountUsd={priceUsd} /></span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => addItem({ id: String(product.id), name: product.name, image_url: product.image_url, priceUsd })}
              className="btn-secondary text-sm py-2 px-3"
            >
              <Plus size={14} />Add
            </button>
            <Link href={`/products/${product.id}`} className="btn-primary text-sm py-2 px-4"><ShoppingCart size={15} />Order</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
