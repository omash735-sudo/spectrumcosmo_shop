'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, CreditCard, Truck, ChevronDown, ChevronUp } from 'lucide-react'

const CURRENCIES = [
  { code: 'MWK', symbol: 'MK', rate: 1 },
  { code: 'USD', symbol: '$', rate: 0.00058 },
  { code: 'ZAR', symbol: 'R', rate: 0.011 },
  { code: 'KES', symbol: 'KSh', rate: 0.075 },
  { code: 'GBP', symbol: '£', rate: 0.00046 },
  { code: 'EUR', symbol: '€', rate: 0.00054 },
]

export default function OrderForm({ productName, productPrice, productId }: {
  productName: string
  productPrice?: number
  productId?: string
}) {
  const [form, setForm] = useState({
    customer_name: '',
    phone_number: '',
    email: '',
    custom_details: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  // Payment & Delivery
  const [paymentOptions, setPaymentOptions] = useState<any[]>([])
  const [deliveryMethods, setDeliveryMethods] = useState<any[]>([])
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Currency
  const [currency, setCurrency] = useState(CURRENCIES[0])

  // Accordion
  const [paymentOpen, setPaymentOpen] = useState(true)
  const [deliveryOpen, setDeliveryOpen] = useState(true)

  useEffect(() => {
    fetch('/api/checkout/options')
      .then(r => r.json())
      .then(data => {
        setPaymentOptions(data.payments || [])
        setDeliveryMethods(data.deliveries || [])
      })
      .finally(() => setLoadingOptions(false))
  }, [])

  const convertPrice = (mwkPrice: number) => {
    return (mwkPrice * currency.rate).toFixed(2)
  }

  const deliveryPrice = selectedDelivery ? Number(selectedDelivery.price) : 0
  const totalPrice = (productPrice || 0) + deliveryPrice

  const mobileWallets = paymentOptions.filter(p => p.type === 'mobile_wallet')
  const banks = paymentOptions.filter(p => p.type === 'bank')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment) { setError('Please select a payment method'); return }
    if (!selectedDelivery) { setError('Please select a delivery method'); return }
    setStatus('loading'); setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          product_name: productName,
          product_id: productId,
          payment_method: selectedPayment.name,
          delivery_method: selectedDelivery.name,
          total_amount: totalPrice,
          currency: currency.code,
        })
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      setStatus('success')
      setForm({ customer_name: '', phone_number: '', email: '', custom_details: '' })
    } catch (err: any) {
      setError(err.message); setStatus('error')
    }
  }

  if (status === 'success') return (
    <div className="flex flex-col items-center text-center py-6 gap-3">
      <CheckCircle className="text-green-500" size={48} />
      <h3 className="font-bold text-[#111111] text-lg">Order Placed!</h3>
      <p className="text-gray-500 text-sm max-w-sm">
        Thank you! Your order for <strong>{productName}</strong> has been received.
        {selectedPayment && (
          <span> Please send payment via <strong>{selectedPayment.name}</strong>: {selectedPayment.details}</span>
        )}
      </p>
      <p className="text-xs text-gray-400">We'll contact you via phone/email to confirm.</p>
      <button onClick={() => setStatus('idle')} className="btn-secondary text-sm mt-2">Place Another Order</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Currency Switcher */}
      <div>
        <label className="label">Display Currency</label>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map(c => (
            <button key={c.code} type="button"
              onClick={() => setCurrency(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                currency.code === c.code
                  ? 'bg-[#F97316] text-white border-[#F97316]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}>
              {c.code}
            </button>
          ))}
        </div>
      </div>

      {/* Price summary */}
      {productPrice && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Product</span>
            <span className="font-medium">{currency.symbol}{convertPrice(productPrice)}</span>
          </div>
          {selectedDelivery && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery ({selectedDelivery.name})</span>
              <span className="font-medium">{currency.symbol}{convertPrice(deliveryPrice)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
            <span>Total</span>
            <span className="text-[#F97316]">{currency.symbol}{convertPrice(totalPrice)}</span>
          </div>
        </div>
      )}

      {/* Customer Details */}
      <div>
        <label className="label">Your Name *</label>
        <input className="input" value={form.customer_name}
          onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
          placeholder="Jane Doe" required />
      </div>
      <div>
        <label className="label">Phone Number *</label>
        <input className="input" value={form.phone_number}
          onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))}
          placeholder="+265 991 234 567" required />
      </div>
      <div>
        <label className="label">Email Address</label>
        <input className="input" type="email" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="you@example.com" />
        <p className="text-xs text-gray-400 mt-1">We'll send your receipt here when order is completed</p>
      </div>
      <div>
        <label className="label">Selected Product</label>
        <input value={productName} readOnly className="input bg-gray-50 text-gray-500 cursor-not-allowed" />
      </div>
      <div>
        <label className="label">Custom Instructions</label>
        <textarea className="input resize-none" value={form.custom_details}
          onChange={e => setForm(p => ({ ...p, custom_details: e.target.value }))}
          placeholder="Size, color preference, special requests..." rows={3} />
      </div>

      {/* Payment Methods */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button type="button" onClick={() => setPaymentOpen(!paymentOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-all">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
            <CreditCard size={16} className="text-[#F97316]" />
            Payment Method {selectedPayment && <span className="text-[#F97316]">— {selectedPayment.name}</span>}
          </div>
          {paymentOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {paymentOpen && (
          <div className="p-4 space-y-4">
            {loadingOptions ? (
              <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-[#F97316]" /></div>
            ) : (
              <>
                {/* Mobile Wallets */}
                {mobileWallets.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">📱 Mobile Wallets</p>
                    <div className="grid grid-cols-1 gap-2">
                      {mobileWallets.map(p => (
                        <button key={p.id} type="button"
                          onClick={() => setSelectedPayment(selectedPayment?.id === p.id ? null : p)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            selectedPayment?.id === p.id
                              ? 'border-[#F97316] bg-orange-50'
                              : 'border-gray-200 hover:border-orange-200'
                          }`}>
                          <div className="flex items-center gap-3">
                            {p.logo_url
                              ? <img src={p.logo_url} alt={p.name} className="w-8 h-8 object-contain rounded" />
                              : <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-xs font-bold text-[#F97316]">{p.name.charAt(0)}</div>
                            }
                            <div>
                              <p className="text-sm font-medium text-[#111111]">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.details}</p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                            selectedPayment?.id === p.id ? 'border-[#F97316] bg-[#F97316]' : 'border-gray-300'
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Banks */}
                {banks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">🏦 Bank Transfer</p>
                    <div className="grid grid-cols-1 gap-2">
                      {banks.map(p => (
                        <button key={p.id} type="button"
                          onClick={() => setSelectedPayment(selectedPayment?.id === p.id ? null : p)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            selectedPayment?.id === p.id
                              ? 'border-[#F97316] bg-orange-50'
                              : 'border-gray-200 hover:border-orange-200'
                          }`}>
                          <div className="flex items-center gap-3">
                            {p.logo_url
                              ? <img src={p.logo_url} alt={p.name} className="w-8 h-8 object-contain rounded" />
                              : <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600">{p.name.charAt(0)}</div>
                            }
                            <div>
                              <p className="text-sm font-medium text-[#111111]">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.details}</p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                            selectedPayment?.id === p.id ? 'border-[#F97316] bg-[#F97316]' : 'border-gray-300'
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Delivery Methods */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button type="button" onClick={() => setDeliveryOpen(!deliveryOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-all">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
            <Truck size={16} className="text-[#F97316]" />
            Delivery Method {selectedDelivery && <span className="text-[#F97316]">— {selectedDelivery.name}</span>}
          </div>
          {deliveryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {deliveryOpen && (
          <div className="p-4">
            {loadingOptions ? (
              <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-[#F97316]" /></div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {deliveryMethods.map(d => (
                  <button key={d.id} type="button"
                    onClick={() => setSelectedDelivery(selectedDelivery?.id === d.id ? null : d)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      selectedDelivery?.id === d.id
                        ? 'border-[#F97316] bg-orange-50'
                        : 'border-gray-200 hover:border-orange-200'
                    }`}>
                    <div className="flex items-center gap-3">
                      {d.logo_url
                        ? <img src={d.logo_url} alt={d.name} className="w-8 h-8 object-contain rounded" />
                        : <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><Truck size={14} className="text-purple-600" /></div>
                      }
                      <div>
                        <p className="text-sm font-medium text-[#111111]">{d.name}</p>
                        <p className="text-xs text-gray-400">{currency.symbol}{convertPrice(Number(d.price))}</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      selectedDelivery?.id === d.id ? 'border-[#F97316] bg-[#F97316]' : 'border-gray-300'
                    }`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full justify-center py-3.5">
        {status === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Placing Order...</> : 'Place Order'}
      </button>
    </form>
  )
}
