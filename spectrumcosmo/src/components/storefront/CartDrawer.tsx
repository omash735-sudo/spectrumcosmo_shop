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
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--background-card)] shadow-2xl flex flex-col z-[1000] animate-slide-in-right">
        
        {/* HEADER - With Manga Panel */}
        <div className="manga-bg cards-manga relative">
          <div className="relative z-10 px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background-card)]/95">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-[var(--primary)]" />
              <h3 className="font-bold text-[var(--foreground)] text-base sm:text-lg">Your Cart</h3>
              <span className="text-xs text-[var(--foreground-muted)]">
                ({items.length} {items.length === 1 ? 'item' : 'items'})
              </span>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 sm:p-2 hover:bg-[var(--background-secondary)] rounded-lg transition"
              aria-label="Close cart"
            >
              <X size={16} className="text-[var(--foreground-muted)] sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto py-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <ShoppingBag size={28} className="text-[var(--foreground-muted)]" />
              </div>
              <p className="text-[var(--foreground-muted)] text-sm">Your cart is empty</p>
              <button
                onClick={onClose}
                className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium transition"
              >
                Continue Shopping →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {items.map((item) => {
                const itemPrice = item.priceUsd * (rates[currency] ?? 1)
                const itemTotal = itemPrice * item.quantity
                
                return (
                  <div key={item.id} className="p-3 sm:p-4 flex gap-3 sm:gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.image_url ? (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-[var(--background-secondary)]">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--background-secondary)] rounded-lg flex items-center justify-center">
                          <ShoppingBag size={20} className="text-[var(--foreground-muted)]" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--foreground)] text-sm sm:text-base truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                        {formatCurrencyAmount(itemPrice, currency)} each
                      </p>
                      <p className="text-xs font-semibold text-[var(--primary)] mt-1">
                        Total: {formatCurrencyAmount(itemTotal, currency)}
                      </p>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 border border-[var(--border)] rounded-lg flex items-center justify-center hover:bg-[var(--background-secondary)] transition"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} className="text-[var(--foreground-muted)]" />
                        </button>

                        <span className="w-6 sm:w-8 text-center text-sm text-[var(--foreground)]">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 border border-[var(--border)] rounded-lg flex items-center justify-center hover:bg-[var(--background-secondary)] transition"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} className="text-[var(--foreground-muted)]" />
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

        {/* FOOTER */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[var(--foreground-muted)] text-sm">Subtotal</span>
              <span className="font-bold text-[var(--foreground)] text-lg">
                {formatCurrencyAmount(subtotal, currency)}
              </span>
            </div>
            
            <p className="text-xs text-[var(--foreground-muted)] mb-4">
              *Shipping and taxes calculated at checkout
            </p>
            
            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3 rounded-xl font-semibold text-center transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Proceed to Checkout
            </Link>
            
            <button
              onClick={onClose}
              className="w-full mt-3 text-center text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition"
            >
              Continue Shopping →
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
