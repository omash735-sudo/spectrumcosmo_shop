'use client'

import { useCart } from '@/components/storefront/CartProvider'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import { formatCurrencyAmount } from '@/lib/currency'

export default function CartCard() {
  const { items, updateQty, removeItem } = useCart()
  const { currency, rates } = useCurrency()

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        Your cart is empty 🛒
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {items.map((item) => {
        const price = item.priceUsd * (rates[currency] ?? 1)
        const total = price * item.quantity

        return (
          <div
            key={item.id}
            className="flex items-center justify-between bg-white border rounded-xl p-4"
          >

            {/* LEFT SIDE */}
            <div className="flex items-center gap-3">

              {/* IMAGE */}
              {item.image_url ? (
                <img
                  src={item.image_url}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-lg" />
              )}

              <div>
                <p className="font-medium text-sm text-[#111]">
                  {item.name}
                </p>

                <p className="text-xs text-gray-500">
                  {formatCurrencyAmount(price, currency)} × {item.quantity}
                </p>

                <p className="text-xs font-semibold text-[#111]">
                  {formatCurrencyAmount(total, currency)}
                </p>
              </div>

            </div>

            {/* RIGHT CONTROLS */}
            <div className="flex items-center gap-2">

              <button
                onClick={() => updateQty(item.id, item.quantity - 1)}
                className="w-7 h-7 border rounded flex items-center justify-center"
              >
                -
              </button>

              <span className="text-sm w-6 text-center">
                {item.quantity}
              </span>

              <button
                onClick={() => updateQty(item.id, item.quantity + 1)}
                className="w-7 h-7 border rounded flex items-center justify-center"
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
        )
      })}

    </div>
  )
}
