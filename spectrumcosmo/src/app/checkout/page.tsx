'use client'

import { useState, useMemo } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useCart } from '@/components/storefront/CartProvider'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import { formatCurrencyAmount } from '@/lib/currency'
import { Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const { items, subtotalUsd } = useCart()
  const { currency, rates } = useCurrency()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    notes: '',
    payment_method: 'airtel_money',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = useMemo(
    () => subtotalUsd * (rates[currency] ?? 1),
    [subtotalUsd, rates, currency]
  )

  const deliveryFee = 1500
  const total = subtotal + deliveryFee

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (items.length === 0) return setError('Cart is empty')
    if (!form.name || !form.phone || !form.location)
      return setError('Fill in name, phone and location')

    setLoading(true)

    try {
      // 1. Create Order ID
      const orderId = `SC-${Date.now()}`

      // 2. Save order in Neon (your DB)
      await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          name: form.name,
          phone: form.phone,
          location: form.location,
          items,
          amount: total,
          payment_method: form.payment_method,
        }),
      })

      // 3. Create PayChangu payment session
      const res = await fetch('/api/paychangu/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          email: `${form.phone}@spectrumcosmo.local`,
          first_name: form.name.split(' ')[0] || 'Customer',
          last_name: form.name.split(' ')[1] || 'User',
          order_id: orderId,
        }),
      })

      if (!res.ok) {
        throw new Error('Payment initialization failed')
      }

      const data = await res.json()

      // 4. Redirect to PayChangu checkout page
      window.location.href = data.checkout_url

    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">

          {/* HEADER */}
          <div className="bg-white p-6 rounded-2xl border mb-6">
            <h1 className="text-2xl font-bold text-[#111]">
              Secure Checkout
            </h1>
            <p className="text-sm text-gray-500">
              Pay securely via Airtel Money, TNM Mpamba, or card
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* FORM */}
            <form
              onSubmit={handleCheckout}
              className="bg-white p-6 rounded-2xl border space-y-3"
            >

              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />

              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />

              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Location (Town, Area)"
                value={form.location}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: e.target.value }))
                }
              />

              <textarea
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
                placeholder="Delivery notes (optional)"
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
              />

              {/* PAYMENT METHOD */}
              <div className="pt-2">
                <p className="text-sm font-semibold mb-2">
                  Payment Method
                </p>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={form.payment_method === 'airtel_money'}
                    onChange={() =>
                      setForm((p) => ({
                        ...p,
                        payment_method: 'airtel_money',
                      }))
                    }
                  />
                  Airtel Money
                </label>

                <label className="flex items-center gap-2 text-sm mt-1">
                  <input
                    type="radio"
                    checked={form.payment_method === 'tnm_mpamba'}
                    onChange={() =>
                      setForm((p) => ({
                        ...p,
                        payment_method: 'tnm_mpamba',
                      }))
                    }
                  />
                  TNM Mpamba
                </label>
              </div>

              {/* SUBMIT */}
              <button
                className="btn-primary w-full mt-4"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Redirecting to payment...
                  </span>
                ) : (
                  'Proceed to Payment'
                )}
              </button>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                  {error}
                </p>
              )}
            </form>

            {/* SUMMARY */}
            <div className="bg-white p-6 rounded-2xl border h-fit">

              <h2 className="font-bold mb-4">Order Summary</h2>

              <div className="space-y-2 text-sm">

                <div className="flex justify-between">
                  <span>Items</span>
                  <span>{items.length}</span>
                </div>

                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {formatCurrencyAmount(subtotal, currency)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{deliveryFee} MWK</span>
                </div>

                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    {formatCurrencyAmount(total, currency)}
                  </span>
                </div>

              </div>

              <p className="text-xs text-gray-500 mt-4">
                Orders are confirmed automatically after payment.
              </p>

            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
