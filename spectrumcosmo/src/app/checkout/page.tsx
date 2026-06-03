'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { useCart } from '@/components/storefront/CartProvider';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import { formatCurrencyAmount } from '@/lib/currency';
import { Loader2, Tag, Gift, X, CheckCircle, Info } from 'lucide-react';
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

interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

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
  
  // Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  
  // Referral code states
  const [referralCode, setReferralCode] = useState('');
  const [savedReferral, setSavedReferral] = useState('');
  const [referralMessage, setReferralMessage] = useState('');
  
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
  const totalBeforeDiscount = subtotal + deliveryFee;
  const finalTotal = Math.max(0, totalBeforeDiscount - discountAmount);

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

  // Apply promo code
  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setPromoLoading(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      const res = await fetch('/api/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode,
          cartTotal: totalBeforeDiscount,
          productIds: items.map(item => item.id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPromoError(data.error || 'Invalid promo code');
        return;
      }

      if (data.valid) {
        setAppliedPromo(data.promoCode);
        setDiscountAmount(data.discountAmount);
        setPromoSuccess(`${data.promoCode.code} applied! You saved ${data.discountAmount.toLocaleString()} MWK`);
        setPromoCode('');
      }
    } catch (err) {
      setPromoError('Something went wrong. Please try again.');
    } finally {
      setPromoLoading(false);
    }
  };

  // Remove promo code
  const removePromoCode = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoSuccess('');
  };

  // Save referral code
  const saveReferralCode = () => {
    if (!referralCode.trim()) {
      setReferralMessage('');
      return;
    }
    setSavedReferral(referralCode.toUpperCase());
    setReferralMessage(`Referral code ${referralCode.toUpperCase()} saved! Your friend will get credit after your purchase.`);
    setReferralCode('');
  };

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
        product_id: item.id,
        product_name: item.name,
        name: item.name,
        quantity: Number(item.quantity),
        price: Number(item.priceUsd ?? 0),
        custom_details: item.custom_details || null,
      }));

      console.log('Sending items to API:', mappedItems);

      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          phone_number: form.phone,
          location: form.notes,
          notes: form.notes,
          items: mappedItems,
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          discount_amount: discountAmount,
          total_amount: finalTotal,
          delivery_method_id: Number(selectedDeliveryId),
          payment_provider_id: selectedPaymentProvider.id,
          payment_method: selectedPaymentProvider.name,
          promo_code_id: appliedPromo?.id || null,
          promo_code: appliedPromo?.code || null,
          referral_code: savedReferral || null,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Order creation failed');
      const orderId = orderData.id;

      // Record promo code usage
      if (appliedPromo && discountAmount > 0) {
        await fetch('/api/apply-promo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId,
            promoCodeId: appliedPromo.id,
            discountAmount: discountAmount,
          }),
        });
      }

      // Track referral
      if (savedReferral) {
        await fetch('/api/referrals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode: savedReferral,
            orderId: orderId,
          }),
        });
      }

      clearCart();

      if (selectedPaymentProvider.type === 'automatic') {
        const paymentRes = await fetch('/api/payments/onekhusa-charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalTotal,
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
        router.push(`/payment?orderId=${orderId}`);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Could not place order. Please try again.');
      setLoading(false);
    }
  };

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
                className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                required
                className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <input
                type="text"
                placeholder="Location (Town, Area)"
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                required
                className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <textarea
                rows={2}
                placeholder="Delivery notes (optional)"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />

              {/* Promo Code Section */}
              <div className="border-t pt-4">
                <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Tag size={16} /> Promo Code
                </label>
                {appliedPromo ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-green-700 font-medium">{appliedPromo.code} applied</p>
                      <p className="text-xs text-green-600">
                        {appliedPromo.discount_type === 'percentage' 
                          ? `${appliedPromo.discount_value}% off` 
                          : `${appliedPromo.discount_value.toLocaleString()} MWK off`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={applyPromoCode}
                      disabled={promoLoading}
                      className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      {promoLoading ? <Loader2 className="animate-spin" size={16} /> : 'Apply'}
                    </button>
                  </div>
                )}
                {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                {promoSuccess && <p className="text-green-500 text-xs mt-1">{promoSuccess}</p>}
              </div>

              {/* Referral Code Section */}
              <div className="border-t pt-4">
                <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Gift size={16} /> Referral Code (Optional)
                </label>
                {savedReferral ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-blue-700 font-medium">Referral code saved: {savedReferral}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Your friend will receive credit after your purchase is completed.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="Enter friend's referral code"
                        className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        type="button"
                        onClick={saveReferralCode}
                        className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200 transition"
                      >
                        Save
                      </button>
                    </div>
                    {referralMessage && <p className="text-green-500 text-xs mt-1">{referralMessage}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      Have a referral code from a friend? Enter it here to support them. They earn rewards when you complete your purchase.
                    </p>
                  </>
                )}
              </div>

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

              <div>
                <p className="text-sm font-semibold mb-2">Payment Method</p>
                
                {paymentProviders?.automatic_enabled && paymentProviders.automatic.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Automatic Payments</p>
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

                {paymentProviders?.manual_enabled && paymentProviders.manual.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Manual Payments</p>
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
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs text-blue-800">
                        <strong>How manual payment works:</strong> After placing your order, you will receive payment instructions via email. 
                        Transfer the amount to the provided account, then upload your proof of payment (screenshot/receipt) for verification. 
                        Our team will verify your payment within 24 hours.
                      </p>
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
                className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-50 hover:bg-orange-600 transition"
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
                  <span>Items ({items.length})</span> <span>{formatCurrencyAmount(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span> <span>{deliveryFee.toLocaleString()} MWK</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span> <span>- {discountAmount.toLocaleString()} MWK</span>
                  </div>
                )}
                {appliedPromo && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Promo: {appliedPromo.code}</span>
                    <span>{appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}%` : `${appliedPromo.discount_value} MWK`}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span> <span>{formatCurrencyAmount(finalTotal, currency)}</span>
                </div>
              </div>
              {selectedPaymentProvider?.type === 'manual' && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800 flex items-start gap-2">
                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                    After placing your order, you will be redirected to a payment page where you can upload your payment proof.
                  </p>
                </div>
              )}
              {selectedPaymentProvider?.type === 'automatic' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800 flex items-start gap-2">
                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                    A payment request will be sent to your phone. Authorize the payment to complete your order.
                  </p>
                </div>
              )}
              {savedReferral && !appliedPromo && (
                <div className="mt-3 text-xs text-gray-500 text-center">
                  Referral code {savedReferral} will be credited to your friend after payment.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
