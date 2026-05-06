// src/app/checkout/page.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'   // useEffect added
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { useCart } from '@/components/storefront/CartProvider'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import { formatCurrencyAmount } from '@/lib/currency'
import { Loader2 } from 'lucide-react'

type PaymentOption = {
  id: string
  type: string
  name: string
  logo_url: string
  account_number: string
  is_active: boolean
  sort_order: number
}

export default function CheckoutPage() {
  const { items, subtotalUsd, clearCart } = useCart()
  const { currency, rates } = useCurrency()
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    notes: '',
    payment_method: 'tnm_mpamba', // default
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; amount: number } | null>(null)

  const subtotal = useMemo(
    () => subtotalUsd * (rates[currency] ?? 1),
    [subtotalUsd, rates, currency]
  )

  const deliveryFee = 1500
  const total = subtotal + deliveryFee

  // Fetch active payment options on mount
  useEffect(() => {
    const fetchPaymentOptions = async () => {
      try {
        const res = await fetch('/api/payment-options')
        if (res.ok) {
          const data = await res.json()
          setPaymentOptions(data.filter((opt: PaymentOption) => opt.is_active))
        }
      } catch (err) {
        console.error('Failed to load payment options', err)
      } finally {
        setLoadingOptions(false)
      }
    }
    fetchPaymentOptions()
  }, [])

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (items.length === 0) return setError('Cart is empty')
    if (!form.name || !form.phone || !form.location)
      return setError('Fill in name, phone and location')

    setLoading(true)

    try {
      // Create order in database – status = 'pending'
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          phone_number: form.phone,
          location: form.location,
          notes: form.notes,
          payment_method: form.payment_method,
          items,
          total_amount: total,
        }),
      })

      if (!res.ok) throw new Error('Order creation failed')
      const order = await res.json()

      // Clear cart after successful order
      clearCart()

      // Show success with payment instructions
      setOrderSuccess({ id: order.id, amount: order.total_amount })
    } catch (err) {
      setError('Could not place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (orderSuccess) {
    // Find the selected payment option details
    const selectedOption = paymentOptions.find(
      opt => opt.name === form.payment_method || opt.type === form.payment_method
    )

    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 py-10">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-2xl border p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Order Placed!</h2>
              <p className="text-gray-500 mt-2">Order #{orderSuccess.id.slice(-8)}</p>
              <p className="text-gray-600 mt-2">Amount to pay: <strong>MWK {orderSuccess.amount.toLocaleString()}</strong></p>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl text-left">
                <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                  📌 Payment Instructions
                </h3>
                <p className="text-sm text-amber-700 mt-2">
                  Send the exact amount to one of the following accounts, then go to <strong>Payments & Orders</strong> in your account to upload proof.
                </p>

                {selectedOption ? (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="font-medium">{selectedOption.name}</p>
                    {selectedOption.type === 'mobile_money' && (
                      <p className="text-sm text-gray-600">Agent Code: <span className="font-mono">{selectedOption.account_number}</span></p>
                    )}
                    {selectedOption.type === 'bank' && (
                      <p className="text-sm text-gray-600">Account: <span className="font-mono">{selectedOption.account_number}</span></p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm mt-2">Use the payment method you selected. Contact support if you need details.</p>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/account/payments" className="bg-orange-500 text-white px-6 py-2 rounded-xl hover:bg-orange-600">
                  Go to Payments
                </a>
                <a href="/" className="border border-gray-300 px-6 py-2 rounded-xl hover:bg-gray-50">
                  Continue Shopping
                </a>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-white p-6 rounded-2xl border mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Secure Checkout</h1>
            <p className="text-sm text-gray-500">Place your order – you’ll receive payment instructions</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Order Form */}
            <form onSubmit={handleCheckout} className="bg-white p-6 rounded-2xl border space-y-4">
              <input
                className="w-full border rounded-xl px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                required
              />
              <input
                className="w-full border rounded-xl px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                required
              />
              <input
                className="w-full border rounded-xl px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Location (Town, Area)"
                value={form.location}
                onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))}
                required
              />
              <textarea
                className="w-full border rounded-xl px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                rows={2}
                placeholder="Delivery notes (optional)"
                value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
              />

              {/* Payment Method selection – from DB options */}
              <div>
                <p className="text-sm font-semibold mb-2">Payment Method</p>
                {loadingOptions ? (
                  <Loader2 className="animate-spin text-orange-500" size={20} />
                ) : (
                  <div className="space-y-2">
                    {paymentOptions.map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="payment_method"
                          value={opt.name}
                          checked={form.payment_method === opt.name}
                          onChange={() => setForm(p => ({ ...p, payment_method: opt.name }))}
                        />
                        {opt.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Placing order...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
            </form>

            {/* Order Summary */}
            <div className="bg-white p-6 rounded-2xl border h-fit">
              <h2 className="font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Items</span><span>{items.length}</span></div>
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrencyAmount(subtotal, currency)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee} MWK</span></div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrencyAmount(total, currency)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">You will receive payment instructions after placing the order.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
