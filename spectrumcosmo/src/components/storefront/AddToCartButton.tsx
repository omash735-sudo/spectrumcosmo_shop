'use client'

import { Plus } from 'lucide-react'
import { useCart } from '@/components/storefront/CartProvider'

export default function AddToCartButton({
  productId,
  productName,
  imageUrl,
  priceUsd,
}: {
  productId: string
  productName: string
  imageUrl?: string
  priceUsd: number
}) {
  const { addItem } = useCart()

  return (
    <button
      onClick={() => addItem({ id: productId, name: productName, image_url: imageUrl, priceUsd })}
      className="btn-secondary"
    >
      <Plus size={16} />
      Add to Cart
    </button>
  )
}

