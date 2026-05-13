'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { useCart } from '@/components/storefront/CartProvider';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import { formatCurrencyAmount } from '@/lib/currency';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

type DeliveryMethod = {
  id: number;
  name: string;
  price: number;
};

type PaymentProvider = {
  id: number;
  name: string;
  type: string;
  category: string;
  logo_url: string | null;
  account_name?: string;
  account_number?: string;
  branch?: string;
  instructions?: string;
};

export default function CheckoutPage() {
  const { items, subtotalUsd, clearCart } = useCart();
  const { currency, rates } = useCurrency();
  const router = useRouter();

  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [paymentProviders, setPaymentProviders] = useState<{
    automatic_enabled: boolean;
    manual_enabled: boolean;
    automatic: PaymentProvider[];
    manual: PaymentProvider[];
  } | null>(null);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProvider | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = useMemo(
    () => subtotalUsd * (rates[currency] ?? 1),
    [subtotalUsd, rates, currency]
  );
  const deliveryFee = deliveryMethods.find(m => m.id === selectedDeliveryId)?.price || 0;
  const total = subtotal + deliveryFee;

  // Fetch delivery methods and payment providers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [delRes, payRes] = await Promise.all([
          fetch('/api/delivery-methods'),
          fetch('/api/payment-providers'),
        ]);

        if (delRes.ok) {
          const data = await delRes.json();
          setDeliveryMethods(data);
          if (data.length > 0) setSelectedDeliveryId(data[0].id);
        }

        if (payRes.ok) {
          const data = await payRes.json();
          setPaymentProviders(data);
          // Auto-select first available payment method
          if (data.automatic.length > 0 && data.automatic_enabled) {
            setSelectedPaymentProvider(data.automatic[0]);
          } else if (data.manual.length > 0 && data.manual_enabled) {
            setSelectedPaymentProvider(data.manual[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load options', err);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchData();
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) return setError('Cart is empty');
    if (!form.name || !form.email || !form.phone || !form.location)
      return setError('Fill in name, email, phone, and location');
    if (!selectedDeliveryId) return setError('Select a delivery method');
    if (!selectedPaymentProvider) return setError('Select a payment method');

    setLoading(true);

    try {
      const mappedItems = items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        price_usd: Number(item.priceUsd ?? 0),
        custom_details: item.custom_details || null,
      }));

      // Create order
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          phone_number: form.phone,
          location: form.location,
          notes: form.notes,
          items: mappedItems,
          total_amount: Number(total),
          delivery_method_id: Number(selectedDeliveryId),
          delivery_fee: Number(deliveryFee),
          payment_provider_id: selectedPaymentProvider.id,
          payment_method: selectedPaymentProvider.name,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Order creation failed');
      const orderId = orderData.id;

      clearCart();

      // Redirect based on payment type
      if (selectedPaymentProvider.type === 'automatic') {
        // Automatic payment - initiate payment
        const paymentRes = await fetch('/api/payments/onekhusa-charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            currency: 'MWK',
            phoneNumber: form.phone,
            paymentMethod: selectedPaymentProvider.name,
            orderId: orderId,
            customerName: form.name,
          }),
        });

        const paymentData = await paymentRes.json();
        if (!paymentRes.ok) throw new Error(paymentData.error || 'Payment initiation failed');

        alert('Payment request sent to your phone. Please check your mobile money app.');
        router.push(`/account/orders?payment=pending&order=${orderId}`);
      } else {
        // Manual payment - go to payment page
        router.push(`/orders/${orderId}/payment`);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Could not place order. Please try again.');
      setLoading(false);
    }
  };

  // Show loading state while options are being fetched
  if (loadingOptions) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 py-10">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white p-6 rounded-2xl border flex items-center justify-center">
              <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white p-6 rounded-2xl border mb-6">
            <h1 className="text-2xl font-bold">Secure Checkout</h1>
            <p className="text-sm text-gray-500">Choose your payment method to complete your order.</p>
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
                <div className="space-y-2">
                  {deliveryMethods.map(m => (
                    <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="delivery_method"
                        checked={selectedDeliveryId === m.id}
                        onChange={() => setSelectedDeliveryId(m.id)}
                        className="cursor-pointer"
                      />
                      <span>{m.name} – {m.price.toLocaleString()} MWK</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <p className="text-sm font-semibold mb-2">Payment Method</p>
                
                {/* Automatic Payments Section */}
                {paymentProviders?.automatic_enabled && paymentProviders.automatic.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">🤖 Automatic Payments</p>
                    <div className="space-y-2">
                      {paymentProviders.automatic.map(p => (
                        <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="payment_method"
                            checked={selectedPaymentProvider?.id === p.id}
                            onChange={() => setSelectedPaymentProvider(p)}
                            className="cursor-pointer"
                          />
                          {p.logo_url ? (
                            <Image src={p.logo_url} alt={p.name} width={24} height={24} className="w-6 h-6 object-contain" />
                          ) : null}
                          <span>{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Payments Section */}
                {paymentProviders?.manual_enabled && paymentProviders.manual.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">📝 Manual Payments</p>
                    <div className="space-y-2">
                      {paymentProviders.manual.map(p => (
                        <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="payment_method"
                            checked={selectedPaymentProvider?.id === p.id}
                            onChange={() => setSelectedPaymentProvider(p)}
                            className="cursor-pointer"
                          />
                          {p.logo_url ? (
                            <Image src={p.logo_url} alt={p.name} width={24} height={24} className="w-6 h-6 object-contain" />
                          ) : null}
                          <span>{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {!paymentProviders?.automatic_enabled && !paymentProviders?.manual_enabled && (
                  <p className="text-xs text-red-500">No payment methods available.</p>
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
              {selectedPaymentProvider?.type === 'manual' && (
                <p className="text-xs text-gray-500 mt-4">
                  After placing your order, you will be redirected to a payment page where you can upload your payment proof.
                </p>
              )}
              {selectedPaymentProvider?.type === 'automatic' && (
                <p className="text-xs text-gray-500 mt-4">
                  A payment request will be sent to your phone. Authorize the payment to complete your order.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
