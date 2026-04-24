'use client'

import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import CartCard from '@/components/storefront/CartCard'
import { useCart } from '@/components/storefront/CartProvider'
import Link from 'next/link'

export default function CartPage() {
  const { items, subtotalUsd } = useCart()

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 py-10">

        <div className="max-w-5xl mx-auto px-4">

          <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

          {/* CART AREA */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* LEFT: ITEMS */}
            <div className="lg:col-span-2 bg-white rounded-2xl border p-5 max-h-[70vh] overflow-y-auto">

              {items.length === 0 ? (
                <p className="text-gray-500">Your cart is empty</p>
              ) : (
                <CartCard />
              )}

            </div>

            {/* RIGHT: SUMMARY */}
            <div className="bg-white rounded-2xl border p-5 h-fit">

              <h2 className="font-bold mb-4">Summary</h2>

              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotalUsd.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm mt-2">
                <span>Items</span>
                <span>{items.length}</span>
              </div>

              <Link
                href="/checkout"
                className="btn-primary w-full mt-5 text-center block"
              >
                Checkout
              </Link>

            </div>

          </div>

        </div>

      </main>

      <Footer />
    </>
  )
}
