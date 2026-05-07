'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [form, setForm] = useState({
    name: '',
    email: '',           // added email field
    phone: '',
    location: '',
    notes: '',
    payment_method: 'tnm_mpamba',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = useMemo(
    () => subtotalUsd * (rates[currency] ?? 1),
    [subtotalUsd, rates, currency]
  )
  const deliveryFee = 1500
  const total = subtotal + deliveryFee

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

    if (items.length === 0) {
      setError('Cart is empty')
      return
    }
    if (!form.name || !form.email || !form.phone || !form.location) {
      setError('Please fill in name, email, phone number, and location')
      return
    }

    setLoading(true)

    try {
      const mappedItems = items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price_usd: item.priceUsd ?? 0,
        custom_details: item.custom_details || null,
      }))

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,   // added
          phone_number: form.phone,
          location: form.location,
          notes: form.notes,
          payment_method: form.payment_method,
          items: mappedItems,
          total_amount: total,
        }),
      })

      if (!res.ok) {
        let errorMsg = `Order creation failed (HTTP ${res.status})`
        try {
          const errorData = await res.json()
          errorMsg = errorData.error || errorMsg
        } catch (_) {}
        throw new Error(errorMsg)
      }

      const order = await res.json()
      clearCart()
      // Redirect to a payment upload page (you can also show a success modal)
      router.push(`/checkout/payment?orderId=${order.id}`)
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Could not place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-white p-6 rounded-2xl border mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Secure Checkout</h1>
            <p className="text-sm text-gray-500">
              Place your order – an invoice will be sent to your email. You'll be guided to upload payment proof.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={handleCheckout} className="bg-white p-6 rounded-2xl border space-y-4">
              <input
                type="text"
                className="w-full border rounded-xl px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                required
              />
              <input
                type="email"
                className="w-full border rounded-xl px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Email Address (for invoice)"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
              <input
                type="tel"
                className="w-full border rounded-xl px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                required
              />
              <input
                type="text"
                className="w-full border rounded-xl px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Location (Town, Area)"
                value={form.location}
                onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))}
                required
              />
              <textarea
                rows={2}
                className="w-full border rounded-xl px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Delivery notes (optional)"
                value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
              />

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
                    {paymentOptions.length === 0 && (
                      <p className="text-xs text-gray-500">No payment methods available. Contact support.</p>
                    )}
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

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}
            </form>

            <div className="bg-white p-6 rounded-2xl border h-fit">
              <h2 className="font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrencyAmount(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{deliveryFee} MWK</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrencyAmount(total, currency)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                After placing the order, you will be redirected to upload your payment proof. An invoice will be sent to your email.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
