'use client'

import { useCart } from '@/components/storefront/CartProvider'

export default function CartCard() {
  const { items, updateQty, removeItem } = useCart()

  return (
    <div className="space-y-3">

      {items.map(item => (
        <div
          key={item.id}
          className="flex items-center justify-between bg-white border rounded-xl p-4"
        >

          {/* LEFT */}
          <div className="flex items-center gap-3">

            <div className="w-12 h-12 bg-gray-100 rounded-lg" />

            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-gray-500">
                ${item.priceUsd} × {item.quantity}
              </p>
            </div>

          </div>

          {/* RIGHT CONTROLS */}
          <div className="flex items-center gap-2">

            <button
              onClick={() => updateQty(item.id, item.quantity - 1)}
              className="w-7 h-7 border rounded"
            >
              -
            </button>

            <span className="text-sm w-6 text-center">
              {item.quantity}
            </span>

            <button
              onClick={() => updateQty(item.id, item.quantity + 1)}
              className="w-7 h-7 border rounded"
            >
              +
            </button>

            <button
              onClick={() => removeItem(item.id)}
              className="text-red-500 text-xs ml-2"
            >
              remove
            </button>

          </div>

        </div>
      ))}

    </div>
  )
}
