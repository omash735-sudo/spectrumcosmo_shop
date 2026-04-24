'use client'

import Link from 'next/link'
import { X, Plus, Minus, Trash2 } from 'lucide-react'
import { useCart } from '@/components/storefront/CartProvider'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import { formatCurrencyAmount } from '@/lib/currency'

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { items, updateQty, removeItem } = useCart()
  const { currency, rates } = useCurrency()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[999]">
      
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* DRAWER */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col z-[1000]">
        
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-[#111111]">Your Cart</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              Your cart is empty.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="p-4 border-b border-gray-100">
                
                <p className="font-medium text-sm">{item.name}</p>

                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrencyAmount(
                    item.priceUsd * (rates[currency] ?? 1),
                    currency
                  )} each
                </p>

                <div className="flex items-center justify-between mt-3">
                  
                  {/* QTY */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-7 h-7 border rounded grid place-items-center"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="w-8 text-center text-sm">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-7 h-7 border rounded grid place-items-center"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* REMOVE */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-gray-100">
          <Link
            href="/checkout"
            onClick={onClose}
            className="btn-primary w-full justify-center"
          >
            Checkout
          </Link>
        </div>
      </aside>
    </div>
  )
}
