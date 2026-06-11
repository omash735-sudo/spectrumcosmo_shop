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

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-6 md:py-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          
          {/* Header with back button */}
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <Link 
              href="/products" 
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Back to products"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Shopping Cart
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            
            {/* LEFT - Cart Items */}
            <div className="flex-1 lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4 md:p-5 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <ShoppingBag size={28} className="text-gray-400 dark:text-gray-500 sm:w-8 sm:h-8" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Your cart is empty</p>
                  <Link 
                    href="/products" 
                    className="mt-3 sm:mt-4 text-orange-500 hover:text-orange-600 text-sm sm:text-base font-medium"
                  >
                    Continue Shopping →
                  </Link>
                </div>
              ) : (
                <CartCard />
              )}
            </div>

            {/* RIGHT - Order Summary */}
            <div className="w-full lg:w-80 xl:w-96 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 md:p-6 h-fit shadow-sm sticky top-24">
              <h2 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white mb-3 sm:mb-4">
                Order Summary
              </h2>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Items ({totalItems})</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {totalItems}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatCurrencyAmount(subtotal, currency)}
                  </span>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 my-2 sm:my-3" />

                <div className="flex justify-between text-base sm:text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-orange-600 dark:text-orange-500">
                    {formatCurrencyAmount(subtotal, currency)}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-200 text-center block"
              >
                Proceed to Checkout
              </Link>

              {/* Trust badges for mobile */}
              <div className="mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[10px] sm:text-xs text-center text-gray-400 dark:text-gray-500">
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
