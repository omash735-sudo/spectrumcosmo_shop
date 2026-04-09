'use client'

import { useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useCart } from '@/components/storefront/CartProvider'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import { formatCurrencyAmount } from '@/lib/currency'
import { Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const { items, updateQty, removeItem, clearCart, subtotalUsd } = useCart()
  const { currency, rates } = useCurrency()
  const [placing, setPlacing] = useState(false)
  const [form, setForm] = useState({ customer_name: '', phone_number: '', custom_details: '' })
  const [message, setMessage] = useState('')

  const subtotal = subtotalUsd * (rates[currency] ?? 1)

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setPlacing(true)
    for (const item of items) {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          product_name: item.name,
          quantity: item.quantity,
          unit_price_usd: item.priceUsd,
          total_price_usd: item.priceUsd * item.quantity,
        }),
      })
    }
    clearCart()
    setPlacing(false)
    setMessage('Order submitted successfully. You can track it in My Account.')
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h1 className="text-2xl font-bold text-[#111111]">Checkout</h1>
              <p className="text-sm text-gray-500">Review cart items and adjust quantities.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">Your cart is empty.</div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#111111]">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrencyAmount(item.priceUsd * (rates[currency] ?? 1), currency)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-2 py-1 border rounded-lg" onClick={() => updateQty(item.id, item.quantity - 1)}>-</button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button className="px-2 py-1 border rounded-lg" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                      <button className="text-sm text-red-500 ml-3" onClick={() => removeItem(item.id)}>Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-6 h-fit">
            <h2 className="font-bold text-[#111111] mb-4">Order Details</h2>
            <form onSubmit={placeOrder} className="space-y-3">
              <input className="input" placeholder="Your name" value={form.customer_name} onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))} required />
              <input className="input" placeholder="Phone number" value={form.phone_number} onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))} required />
              <textarea className="input resize-none" rows={3} placeholder="Notes (optional)" value={form.custom_details} onChange={(e) => setForm((p) => ({ ...p, custom_details: e.target.value }))} />
              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-[#111111]">{formatCurrencyAmount(subtotal, currency)}</span>
              </div>
              <button type="submit" disabled={placing || items.length === 0} className="btn-primary w-full justify-center">
                {placing ? <><Loader2 size={16} className="animate-spin" />Placing...</> : 'Checkout'}
              </button>
              <a href="/products" className="btn-secondary w-full justify-center">Continue Browsing</a>
              {message && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2">{message}</p>}
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

