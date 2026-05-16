'use client'

import { useEffect, useState } from 'react'
import { Star, ShoppingCart, Heart, Loader2, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/storefront/CartProvider'

interface WishlistItem {
  id: number
  name: string
  price: number
  rating: number
  image: string
  in_stock: boolean  // Fixed: match API response
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const { addItem } = useCart()

  const fetchWishlist = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/account/wishlist')
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login?redirect=/account/wishlist'
          return
        }
        throw new Error('Failed to load wishlist')
      }
      const data = await res.json()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [])

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      id: String(item.id),
      name: item.name,
      image_url: item.image,
      priceUsd: item.price,
    })
  }

  const handleRemoveFromWishlist = async (itemId: number) => {
    setRemovingId(itemId)
    try {
      const res = await fetch('/api/account/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: itemId }),
      })
      
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== itemId))
      }
    } catch (err) {
      console.error('Failed to remove:', err)
    } finally {
      setRemovingId(null)
    }
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
          onClick={() => fetchWishlist()}
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
        <p className="text-gray-500 mt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Your wishlist is empty.</p>
          <Link
            href="/products"
            className="inline-block mt-4 text-orange-500 text-sm font-medium hover:underline"
          >
            Browse products →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
            >
              {/* Image */}
              <Link href={`/product/${item.id}`}>
                <div className="bg-gray-50 h-48 flex items-center justify-center relative overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="text-6xl">📦</div>
                  )}
                </div>
              </Link>

              <div className="p-4">
                <Link href={`/product/${item.id}`}>
                  <h3 className="font-semibold text-gray-900 text-lg line-clamp-1 hover:text-orange-500 transition">
                    {item.name}
                  </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={`${
                            i < Math.floor(item.rating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                  </div>
                  {item.rating > 0 && (
                    <span className="text-xs text-gray-400 ml-1">
                      {item.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Price */}
                <p className="text-orange-500 font-bold text-xl mt-3">
                  K {item.price.toLocaleString()}
                </p>

                {/* Stock status */}
                <p
                  className={`text-xs mt-1 ${
                    item.in_stock ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {item.in_stock ? '✓ In stock' : '✗ Out of stock'}
                </p>

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.in_stock}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      item.in_stock
                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart size={16} />
                    Add to cart
                  </button>
                  
                  <button
                    onClick={() => handleRemoveFromWishlist(item.id)}
                    disabled={removingId === item.id}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 transition disabled:opacity-50"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
