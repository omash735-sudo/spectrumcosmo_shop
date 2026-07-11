'use client'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import CartCard from '@/components/storefront/CartCard'
import { useCart } from '@/components/storefront/CartProvider'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import { formatCurrencyAmount } from '@/lib/currency'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft } from 'lucide-react'

export default function CartPage() {
  const { items, subtotalUsd, totalItems } = useCart()
  const { currency, rates } = useCurrency()

  const subtotal = subtotalUsd * (rates[currency] ?? 1)

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[var(--background)] py-4 sm:py-6 md:py-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          
          {/* Header with back button */}
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Link 
              href="/products" 
              className="p-2 -ml-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors"
              aria-label="Back to products"
            >
              <ArrowLeft size={20} className="text-[var(--foreground-muted)]" />
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)]">
              Shopping Cart
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            
            {/* LEFT - Cart Items */}
            <div className="flex-1 lg:col-span-2 bg-[var(--background-card)] rounded-xl sm:rounded-2xl border border-[var(--border)] p-3 sm:p-4 md:p-5 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <ShoppingBag size={28} className="text-[var(--foreground-muted)]/50 sm:w-8 sm:h-8" />
                  </div>
                  <p className="text-[var(--foreground-muted)] text-sm sm:text-base">Your cart is empty</p>
                  <Link 
                    href="/products" 
                    className="mt-3 sm:mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm sm:text-base font-medium transition"
                  >
                    Continue Shopping →
                  </Link>
                </div>
              ) : (
                <CartCard />
              )}
            </div>

            {/* RIGHT - Order Summary */}
            <div className="w-full lg:w-80 xl:w-96 bg-[var(--background-card)] rounded-xl sm:rounded-2xl border border-[var(--border)] p-4 sm:p-5 md:p-6 h-fit shadow-sm sticky top-24">
              <h2 className="font-semibold text-base sm:text-lg text-[var(--foreground)] mb-3 sm:mb-4">
                Order Summary
              </h2>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Items ({totalItems})</span>
                  <span className="text-[var(--foreground)] font-medium">
                    {totalItems}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Subtotal</span>
                  <span className="text-[var(--foreground)] font-medium">
                    {formatCurrencyAmount(subtotal, currency)}
                  </span>
                </div>

                <div className="border-t border-[var(--border)] my-2 sm:my-3" />

                <div className="flex justify-between text-base sm:text-lg font-bold">
                  <span className="text-[var(--foreground)]">Total</span>
                  <span className="text-[var(--primary)]">
                    {formatCurrencyAmount(subtotal, currency)}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full mt-4 sm:mt-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-200 text-center block shadow-md hover:shadow-lg"
              >
                Proceed to Checkout
              </Link>

              {/* Trust badges for mobile */}
              <div className="mt-4 pt-3 sm:pt-4 border-t border-[var(--border)]">
                <p className="text-[10px] sm:text-xs text-center text-[var(--foreground-muted)]">
                  Secure checkout • 100% Authentic • Fast Delivery
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
