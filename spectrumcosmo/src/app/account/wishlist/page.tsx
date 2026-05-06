'use client'

import AccountLayout from '@/components/account/AccountLayout'
import { Star, ShoppingCart } from 'lucide-react'

interface WishlistItem {
  id: number
  name: string
  price: number
  rating: number
  image: string
  inStock: boolean
}

export default function WishlistPage() {
  const items: WishlistItem[] = [
    { id: 1, name: 'Minimalist Backpack', price: 79.99, rating: 4.5, image: '🎒', inStock: true },
    { id: 2, name: 'Wireless Headphones', price: 129.99, rating: 4.8, image: '🎧', inStock: true },
    { id: 3, name: 'Cotton Hoodie (Black)', price: 59.99, rating: 4.2, image: '👕', inStock: true },
  ]

  return (
    <AccountLayout>

      <h1 className="text-2xl font-bold text-[#111] mb-2">
        My Wishlist
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Items you saved for later
      </p>

      {items.length === 0 ? (
        <div className="bg-white border rounded-xl p-6 text-sm text-gray-500">
          Your wishlist is empty.
        </div>
      ) : (

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border rounded-xl p-4 text-center hover:shadow-md transition"
            >

              {/* IMAGE */}
              <div className="text-5xl mb-2">
                {item.image}
              </div>

              {/* NAME */}
              <p className="font-semibold text-[#111]">
                {item.name}
              </p>

              {/* RATING */}
              <div className="flex justify-center items-center text-yellow-400 text-sm mt-1">
                {Array(5).fill(0).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < Math.floor(item.rating) ? 'currentColor' : 'none'}
                  />
                ))}
                <span className="text-gray-400 text-xs ml-1">
                  {item.rating}
                </span>
              </div>

              {/* PRICE */}
              <p className="text-orange-500 font-bold text-lg mt-2">
                ${item.price}
              </p>

              {/* STOCK STATUS */}
              <p className="text-xs mt-1 text-gray-500">
                {item.inStock ? 'In stock' : 'Out of stock'}
              </p>

              {/* BUTTON */}
              <button className="mt-3 w-full bg-orange-500 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition">
                <ShoppingCart size={16} />
                Add to cart
              </button>

            </div>
          ))}

        </div>

      )}

    </AccountLayout>
  )
}
