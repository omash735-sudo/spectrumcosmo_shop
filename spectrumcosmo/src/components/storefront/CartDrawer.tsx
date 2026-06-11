'use client'

import Link from 'next/link'
import Image from 'next/image'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
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

  const subtotal = items.reduce((sum, item) => {
    const price = item.priceUsd * (rates[currency] ?? 1)
    return sum + (price * item.quantity)
  }, 0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[999]">
      
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300"
      />

      {/* DRAWER */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col z-[1000] animate-slide-in-right">
        
        {/* HEADER */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-orange-500" />
            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">Your Cart</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            aria-label="Close cart"
          >
            <X size={16} className="text-gray-500 dark:text-gray-400 sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <ShoppingBag size={28} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your cart is empty</p>
              <button
                onClick={onClose}
                className="mt-4 text-orange-500 hover:text-orange-600 text-sm font-medium"
              >
                Continue Shopping →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => {
                const itemPrice = item.priceUsd * (rates[currency] ?? 1)
                const itemTotal = itemPrice * item.quantity
                
                return (
                  <div key={item.id} className="p-3 sm:p-4 flex gap-3 sm:gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.image_url ? (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <ShoppingBag size={20} className="text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatCurrencyAmount(itemPrice, currency)} each
                      </p>
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-1">
                        Total: {formatCurrencyAmount(itemTotal, currency)}
                      </p>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} className="text-gray-600 dark:text-gray-400" />
                        </button>

                        <span className="w-6 sm:w-8 text-center text-sm text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} className="text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* FOOTER - Only show if cart has items */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            {/* Subtotal */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Subtotal</span>
              <span className="font-bold text-gray-900 dark:text-white text-lg">
                {formatCurrencyAmount(subtotal, currency)}
              </span>
            </div>
            
            {/* Shipping notice */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              *Shipping and taxes calculated at checkout
            </p>
            
            {/* Checkout Button */}
            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold text-center transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Proceed to Checkout
            </Link>
            
            {/* Continue Shopping Link */}
            <button
              onClick={onClose}
              className="w-full mt-3 text-center text-sm text-gray-500 dark:text-gray-400 hover:text-orange-500 transition"
            >
              Continue Shopping →
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
