'use client'

import { useState } from 'react'
import { Plus, ShoppingCart, Loader2, CheckCircle } from 'lucide-react'
import { useCart } from '@/components/storefront/CartProvider'

interface AddToCartButtonProps {
  productId: string
  productName: string
  imageUrl?: string
  priceUsd: number
  variantId?: string | null
  disabled?: boolean
  className?: string
  showIcon?: boolean
  onSuccess?: () => void
}

export default function AddToCartButton({
  productId,
  productName,
  imageUrl,
  priceUsd,
  variantId = null,
  disabled = false,
  className = '',
  showIcon = true,
  onSuccess,
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleAddToCart = async () => {
    if (disabled) return
    
    setLoading(true)
    try {
      addItem({ 
        id: productId, 
        name: productName, 
        image_url: imageUrl, 
        priceUsd,
        variant_id: variantId || undefined,
      })
      
      setSuccess(true)
      if (onSuccess) onSuccess()
      
      setTimeout(() => {
        setSuccess(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to add to cart:', err)
    } finally {
      setLoading(false)
    }
  }

  if (disabled) {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-400 cursor-not-allowed ${className}`}
      >
        Out of Stock
      </button>
    )
  }

  if (success) {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-green-500 text-white ${className}`}
      >
        <CheckCircle size={18} />
        Added to Cart
      </button>
    )
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : showIcon ? (
        <ShoppingCart size={18} />
      ) : (
        <Plus size={18} />
      )}
      {loading ? 'Adding...' : showIcon ? 'Add to Cart' : 'Add'}
    </button>
  )
}
