'use client'

import { useCart } from '@/components/storefront/CartProvider'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import { formatCurrencyAmount } from '@/lib/currency'
import { Trash2, Minus, Plus } from 'lucide-react'

export default function CartCard() {
  const { items, updateQty, removeItem } = useCart()
  const { currency, rates } = useCurrency()

  if (items.length === 0) {
    return (
      <div className="text-center py-8 sm:py-10 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
        Your cart is empty
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {items.map((item) => {
        const price = item.priceUsd * (rates[currency] ?? 1)
        const total = price * item.quantity

        return (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 sm:p-4 gap-3 sm:gap-4"
          >
            {/* LEFT SIDE - Product Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* IMAGE */}
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                  {item.name}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatCurrencyAmount(price, currency)} × {item.quantity}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                  {formatCurrencyAmount(total, currency)}
                </p>
              </div>
            </div>

            {/* RIGHT CONTROLS - Quantity and Remove */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="w-6 h-6 sm:w-7 sm:h-7 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-400"
                  aria-label="Decrease quantity"
                >
                  <Minus size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>

                <span className="text-xs sm:text-sm w-6 sm:w-8 text-center text-gray-900 dark:text-white">
                  {item.quantity}
                </span>

                <button
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="w-6 h-6 sm:w-7 sm:h-7 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-400"
                  aria-label="Increase quantity"
                >
                  <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-600 text-[10px] sm:text-xs font-medium flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                aria-label="Remove item"
              >
                <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Remove</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
