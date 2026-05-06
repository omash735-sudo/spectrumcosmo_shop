'use client'

import { useEffect, useState } from 'react'
import { Star, ShoppingCart, Heart, Loader2 } from 'lucide-react'

interface WishlistItem {
  id: number
  name: string
  price: number
  rating: number
  image: string  // URL or emoji – adjust based on your data
  inStock: boolean
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/account/wishlist')
        if (!res.ok) throw new Error('Failed to load wishlist')
        const data = await res.json()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchWishlist()
  }, [])

  const handleAddToCart = async (item: WishlistItem) => {
    // Implement add to cart logic – e.g., POST to /api/cart
    console.log('Add to cart', item.id)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-red-500">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-orange-500 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          My Wishlist
        </h1>
        <p className="text-gray-500 mt-1">Items you saved for later</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Your wishlist is empty.</p>
          <button
            onClick={() => (window.location.href = '/shop')}
            className="mt-4 text-orange-500 text-sm font-medium hover:underline"
          >
            Browse products
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="bg-gray-50 p-6 flex items-center justify-center text-6xl">
                {item.image}
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {item.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${
                            i < Math.floor(item.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                  </div>
                  <span className="text-xs text-gray-400 ml-1">{item.rating}</span>
                </div>

                {/* Price */}
                <p className="text-orange-500 font-bold text-2xl mt-3">
                  ${item.price.toFixed(2)}
                </p>

                {/* Stock status */}
                <p
                  className={`text-xs mt-1 ${
                    item.inStock ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {item.inStock ? '✓ In stock' : '✗ Out of stock'}
                </p>

                {/* Add to cart button */}
                <button
                  onClick={() => handleAddToCart(item)}
                  className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    item.inStock
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!item.inStock}
                >
                  <ShoppingCart size={16} />
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
