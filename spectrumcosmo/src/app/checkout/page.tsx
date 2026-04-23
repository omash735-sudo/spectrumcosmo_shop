'use client'

import { useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useCart } from '@/components/storefront/CartProvider'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import { formatCurrencyAmount } from '@/lib/currency'
import { Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const { items, updateQty, removeItem, subtotalUsd } = useCart()
  const { currency, rates } = useCurrency()

  const [form, setForm] = useState({
    customer_name: '',
    phone_number: '',
    custom_details: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = subtotalUsd * (rates[currency] ?? 1)

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()

    setError('')

    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }

    if (!form.customer_name.trim() || !form.phone_number.trim()) {
      setError('Please enter your name and phone number.')
      return
    }

    setLoading(true)

    const checkoutData = {
      items,
      form,
      subtotalUsd
    }

    localStorage.setItem('checkoutData', JSON.stringify(checkoutData))

    window.location.href = '/checkout/payment'
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-3 gap-6">

          {/* CART SECTION */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100">

            <div className="px-6 py-4 border-b border-gray-100">
              <h1 className="text-2xl font-bold text-[#111111]">Checkout</h1>
              <p className="text-sm text-gray-500">
                Review your items before proceeding to payment
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">
                  Your cart is empty.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-6 flex flex-wrap items-center justify-between gap-4">

                    <div>
                      <p className="font-semibold text-[#111111]">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrencyAmount(
                          item.priceUsd * (rates[currency] ?? 1),
                          currency
                        )} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="px-2 py-1 border rounded-lg"
                      >
                        -
                      </button>

                      <span className="w-8 text-center">{item.quantity}</span>

                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="px-2 py-1 border rounded-lg"
                      >
                        +
                      </button>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-red-500 ml-3"
                      >
                        Remove
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>

          </section>

          {/* DETAILS SECTION */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 h-fit">

            <h2 className="font-bold text-[#111111] mb-4">
              Order Details
            </h2>

            <form onSubmit={handleContinue} className="space-y-3">

              <input
                className="input"
                placeholder="Full Name"
                value={form.customer_name}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    customer_name: e.target.value
                  }))
                }
              />

              <input
                className="input"
                placeholder="Phone Number"
                value={form.phone_number}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    phone_number: e.target.value
                  }))
                }
              />

              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Additional Notes (optional)"
                value={form.custom_details}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    custom_details: e.target.value
                  }))
                }
              />

              {/* TOTAL */}
              <div className="flex items-center justify-between text-sm pt-3 border-t">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-[#111111]">
                  {formatCurrencyAmount(subtotal, currency)}
                </span>
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </button>

              {/* ERROR */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

            </form>

          </section>

        </div>
      </main>

      <Footer />
    </>
  )
}
