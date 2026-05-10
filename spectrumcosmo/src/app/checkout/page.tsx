'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { useCart } from '@/components/storefront/CartProvider';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import { formatCurrencyAmount } from '@/lib/currency';
import { Loader2 } from 'lucide-react';

type PaymentOption = {
  id: string;
  type: string;
  name: string;
  logo_url: string;
  account_number: string;
  is_active: boolean;
};

type DeliveryMethod = {
  id: number;
  name: string;
  price: number;
};

export default function CheckoutPage() {
  const { items, subtotalUsd, clearCart } = useCart();
  const { currency, rates } = useCurrency();
  const router = useRouter();

  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    notes: '',
    payment_method: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = useMemo(
    () => subtotalUsd * (rates[currency] ?? 1),
    [subtotalUsd, rates, currency]
  );
  const deliveryFee = deliveryMethods.find(m => m.id === selectedDeliveryId)?.price || 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [payRes, delRes] = await Promise.all([
          fetch('/api/payment-options'),
          fetch('/api/delivery-methods'),
        ]);

        if (payRes.ok) {
          const data = await payRes.json();
          const active = data.filter((opt: PaymentOption) => opt.is_active);
          setPaymentOptions(active);
          if (active.length) setForm(f => ({ ...f, payment_method: active[0].name }));
        } else {
          console.error('Payment options failed', payRes.status);
        }

        if (delRes.ok) {
          const data = await delRes.json();
          const safe = data.map((m: any) => ({
            id: Number(m.id),
            name: m.name,
            price: Number(m.price),
          }));
          setDeliveryMethods(safe);
          if (safe.length) setSelectedDeliveryId(safe[0].id);
        } else {
          console.error('Delivery methods failed', delRes.status);
          const fallback = [{ id: 1, name: 'Standard Delivery', price: 1500 }];
          setDeliveryMethods(fallback);
          setSelectedDeliveryId(1);
        }
      } catch (err) {
        console.error('Failed to load options', err);
        setError('Could not load payment/delivery options. Please refresh.');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) return setError('Cart is empty');
    if (!form.name || !form.email || !form.phone || !form.location)
      return setError('Fill in name, email, phone, and location');
    if (!form.payment_method) return setError('Select a payment method');
    if (!selectedDeliveryId) return setError('Select a delivery method');

    setLoading(true);

    try {
      const mappedItems = items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        price_usd: Number(item.priceUsd ?? 0),
        custom_details: item.custom_details || null,
      }));

      // 1. Create order
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          phone_number: form.phone,
          location: form.location,
          notes: form.notes,
          payment_method: form.payment_method,
          items: mappedItems,
          total_amount: Number(total),
          delivery_method_id: Number(selectedDeliveryId),
          delivery_fee: Number(deliveryFee),
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${orderRes.status}`);
      }

      const order = await orderRes.json();
      clearCart();

      // 2. Initiate OneKhusa payment
      const paymentRes = await fetch('/api/payments/onekhusa-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'MWK',
          phoneNumber: form.phone,
          paymentMethod: form.payment_method,
          orderId: order.id,
          customerName: form.name,
        }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) throw new Error(paymentData.error || 'Payment initiation failed');

      // 3. Redirect to OneKhusa hosted payment page
      if (paymentData.redirectUrl) {
        window.location.href = paymentData.redirectUrl;
      } else {
        // Fallback (should not happen)
        router.push(`/checkout/payment?orderId=${order.id}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white p-6 rounded-2xl border mb-6">
            <h1 className="text-2xl font-bold">Secure Checkout</h1>
            <p className="text-sm text-gray-500">
              Place your order – you will be redirected to the secure payment page.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={handleCheckout} className="bg-white p-6 rounded-2xl border space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
                className="w-full border rounded-xl px-3 py-2"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                className="w-full border rounded-xl px-3 py-2"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                required
                className="w-full border rounded-xl px-3 py-2"
              />
              <input
                type="text"
                placeholder="Location (Town, Area)"
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                required
                className="w-full border rounded-xl px-3 py-2"
              />
              <textarea
                rows={2}
                placeholder="Delivery notes (optional)"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2"
              />

              {/* Delivery Methods */}
              <div>
                <p className="text-sm font-semibold mb-2">Delivery Method</p>
                {deliveryMethods.length === 0 ? (
                  <p className="text-xs text-gray-400">Loading delivery options...</p>
                ) : (
                  <div className="space-y-2">
                    {deliveryMethods.map(m => (
                      <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="delivery_method"
                          value={m.id}
                          checked={selectedDeliveryId === m.id}
                          onChange={() => setSelectedDeliveryId(m.id)}
                          className="cursor-pointer"
                        />
                        <span>{m.name} – {m.price.toLocaleString()} MWK</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div>
                <p className="text-sm font-semibold mb-2">Payment Method</p>
                {loadingOptions ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : paymentOptions.length === 0 ? (
                  <p className="text-xs text-gray-400">No payment methods available.</p>
                ) : (
                  <div className="space-y-2">
                    {paymentOptions.map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="payment_method"
                          value={opt.name}
                          checked={form.payment_method === opt.name}
                          onChange={() => setForm(p => ({ ...p, payment_method: opt.name }))}
                          className="cursor-pointer"
                        />
                        <span>{opt.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin inline mr-2" size={16} /> : null}
                {loading ? 'Processing...' : 'Place Order'}
              </button>

              {error && <div className="text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            </form>

            {/* Order Summary */}
            <div className="bg-white p-6 rounded-2xl border h-fit">
              <h2 className="font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items</span> <span>{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span> <span>{formatCurrencyAmount(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span> <span>{deliveryFee.toLocaleString()} MWK</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span> <span>{formatCurrencyAmount(total, currency)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                You will be redirected to the payment gateway after placing the order.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
