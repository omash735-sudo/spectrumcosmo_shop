'use client'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import CartCard from '@/components/storefront/CartCard'
import { useCart } from '@/components/storefront/CartProvider'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import { formatCurrencyAmount } from '@/lib/currency'
import Link from 'next/link'

export default function CartPage() {
  const { items, subtotalUsd, totalItems } = useCart()
  const { currency, rates } = useCurrency()

  const subtotal = subtotalUsd * (rates[currency] ?? 1)

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 py-10">

        <div className="max-w-6xl mx-auto px-4">

          <h1 className="text-3xl font-bold text-[#111] mb-6">
            Shopping Cart
          </h1>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* LEFT */}
            <div className="lg:col-span-2 bg-white rounded-2xl border p-5 max-h-[70vh] overflow-y-auto">

              {items.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  Your cart is empty.
                </div>
              ) : (
                <CartCard />
              )}

            </div>

            {/* RIGHT */}
            <div className="bg-white rounded-2xl border p-6 h-fit shadow-sm">

              <h2 className="font-semibold text-lg mb-4">
                Order Summary
              </h2>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Items</span>
                <span>{totalItems}</span>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">
                  {formatCurrencyAmount(subtotal, currency)}
                </span>
              </div>

              <div className="border-t my-4" />

              <div className="flex justify-between text-lg font-bold mb-4">
                <span>Total</span>
                <span>
                  {formatCurrencyAmount(subtotal, currency)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="btn-primary w-full text-center block"
              >
                Proceed to Checkout
              </Link>

            </div>

          </div>

        </div>

      </main>

      <Footer />
    </>
  )
}
