// app/checkout/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { useCart } from '@/components/storefront/CartProvider';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import { formatCurrencyAmount } from '@/lib/currency';
import { 
  Loader2, Tag, Gift, X, CheckCircle, Info, Truck, 
  CreditCard, Shield, User, Mail, Phone, MapPin, 
  MessageSquare, ChevronRight, Lock, Sparkles, 
  Banknote, Smartphone, Clock, ArrowRight,
  ShoppingBag
} from 'lucide-react';
import Image from 'next/image';

type DeliveryMethod = {
  id: number;
  name: string;
  price: number;
  estimated_days?: string;
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
  
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const removePromoCode = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoSuccess('');
  };

  const saveReferralCode = () => {
    if (!referralCode.trim()) {
      setReferralMessage('');
      setSavedReferral('');
      return;
    }
    setSavedReferral(referralCode.toUpperCase());
    setReferralMessage(`Referral code ${referralCode.toUpperCase()} saved! Your friend will get credit after your purchase.`);
    setReferralCode('');
  };

  const removeReferralCode = () => {
    setSavedReferral('');
    setReferralMessage('');
    setReferralCode('');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) return setError('Cart is empty');
    if (!form.name || !form.email || !form.phone || !form.location) {
      return setError('Please fill in all required fields');
    }
    if (!selectedDeliveryId) return setError('Please select a delivery method');
    if (!selectedPaymentProvider) return setError('Please select a payment method');

    setLoading(true);

    try {
      const mappedItems = items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: Number(item.quantity),
        price: Number(item.priceUsd ?? 0),
      }));

      const orderPayload = {
        customer_name: form.name,
        customer_email: form.email,
        phone_number: form.phone,
        location: form.location,
        notes: form.notes || null,
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
      };

      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Order creation failed');
      const orderId = orderData.id;

      if (appliedPromo && discountAmount > 0) {
        await fetch('/api/apply-promo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, promoCodeId: appliedPromo.id, discountAmount }),
        }).catch(console.error);
      }

      if (savedReferral) {
        await fetch('/api/referrals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referralCode: savedReferral, orderId }),
        }).catch(console.error);
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
            orderId,
            customerName: form.name,
          }),
        });

        const paymentData = await paymentRes.json();
        if (!paymentRes.ok) throw new Error(paymentData.error || 'Payment initiation failed');

        alert('Payment request sent to your phone. Please check your mobile money app.');
        router.push(`/account/orders?payment=pending&order=${orderId}`);
      } else {
        router.push(`/checkout/payment?orderId=${orderId}`);
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const inputClasses = (fieldName: string) => `
    w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
    ${focusedField === fieldName 
      ? 'border-orange-400 shadow-md ring-2 ring-orange-100' 
      : 'border-gray-200 hover:border-gray-300'
    }
    focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100
  `;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          
          {/* Header */}
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Secure Checkout</h1>
            <p className="text-gray-500 mt-2">Complete your purchase with confidence</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Lock size={14} /> 256-bit SSL Secure
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Shield size={14} /> Buyer Protection
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <User size={18} className="text-orange-500" />
                    Contact & Delivery Details
                  </h2>
                </div>
                <div className="p-6">
                  <form onSubmit={handleCheckout} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={form.name}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            required
                            className={`${inputClasses('name')} pl-10`}
                            placeholder="Your name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            value={form.email}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            required
                            className={`${inputClasses('email')} pl-10`}
                            placeholder="yourmail@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            value={form.phone}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                            required
                            className={`${inputClasses('phone')} pl-10`}
                            placeholder="0999 123 456"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Delivery Location <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={form.location}
                            onFocus={() => setFocusedField('location')}
                            onBlur={() => setFocusedField(null)}
                            onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                            required
                            className={`${inputClasses('location')} pl-10`}
                            placeholder="Lilongwe, Area 3"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                        <MessageSquare size={16} /> Delivery Notes <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={form.notes}
                        onFocus={() => setFocusedField('notes')}
                        onBlur={() => setFocusedField(null)}
                        onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        className={`${inputClasses('notes')} resize-none`}
                        placeholder="Gate code, landmark, special instructions..."
                      />
                    </div>

                    {/* Promo Code Section */}
                    <div className="border-t border-gray-100 pt-5">
                      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Tag size={16} className="text-orange-500" /> 
                        Promo Code <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      {appliedPromo ? (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle size={16} className="text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-700">{appliedPromo.code}</p>
                              <p className="text-xs text-green-600">
                                {appliedPromo.discount_type === 'percentage' 
                                  ? `${appliedPromo.discount_value}% off` 
                                  : `${appliedPromo.discount_value.toLocaleString()} MWK off`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removePromoCode}
                            className="text-red-500 hover:text-red-600 transition p-1"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="Enter promo code"
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                          />
                          <button
                            type="button"
                            onClick={applyPromoCode}
                            disabled={promoLoading}
                            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50"
                          >
                            {promoLoading ? <Loader2 className="animate-spin" size={18} /> : 'Apply'}
                          </button>
                        </div>
                      )}
                      {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
                      {promoSuccess && <p className="text-green-500 text-sm mt-2">{promoSuccess}</p>}
                    </div>

                    {/* Referral Code Section */}
                    <div className="border-t border-gray-100 pt-5">
                      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Gift size={16} className="text-orange-500" /> 
                        Referral Code <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      {savedReferral ? (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Sparkles size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-blue-700">Referral code saved: {savedReferral}</p>
                              <p className="text-xs text-blue-600">Your friend will get credit after your purchase</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeReferralCode}
                            className="text-red-500 hover:text-red-600 transition p-1"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            placeholder="Enter friend's referral code"
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                          />
                          <button
                            type="button"
                            onClick={saveReferralCode}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                          >
                            Save
                          </button>
                        </div>
                      )}
                      {referralMessage && <p className="text-green-500 text-sm mt-2">{referralMessage}</p>}
                    </div>

                    {/* Delivery Method */}
                    <div className="border-t border-gray-100 pt-5">
                      <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Truck size={16} className="text-orange-500" /> 
                        Delivery Method <span className="text-red-500">*</span>
                      </label>
                      <div className="grid gap-3">
                        {deliveryMethods.map(m => (
                          <label
                            key={m.id}
                            className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              selectedDeliveryId === m.id
                                ? 'border-orange-400 bg-orange-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="radio"
                                name="delivery_method"
                                checked={selectedDeliveryId === m.id}
                                onChange={() => setSelectedDeliveryId(m.id)}
                                className="w-5 h-5 text-orange-500"
                              />
                              <div>
                                <p className="font-medium text-gray-800">{m.name}</p>
                                {m.estimated_days && (
                                  <p className="text-xs text-gray-400">Estimated {m.estimated_days}</p>
                                )}
                              </div>
                            </div>
                            <p className="font-semibold text-gray-900">{m.price.toLocaleString()} MWK</p>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="border-t border-gray-100 pt-5">
                      <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <CreditCard size={16} className="text-orange-500" /> 
                        Payment Method <span className="text-red-500">*</span>
                      </label>
                      
                      {paymentProviders?.automatic_enabled && paymentProviders.automatic.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                            <Smartphone size={12} /> Automatic Payments
                          </p>
                          <div className="grid gap-3">
                            {paymentProviders.automatic.map(p => (
                              <label
                                key={p.id}
                                className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                  selectedPaymentProvider?.id === p.id
                                    ? 'border-orange-400 bg-orange-50 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <input
                                    type="radio"
                                    name="payment_method"
                                    checked={selectedPaymentProvider?.id === p.id}
                                    onChange={() => setSelectedPaymentProvider(p)}
                                    className="w-5 h-5 text-orange-500"
                                  />
                                  {p.logo_url && (
                                    <Image src={p.logo_url} alt={p.name} width={32} height={32} className="w-8 h-8 object-contain" />
                                  )}
                                  <span className="font-medium text-gray-800">{p.name}</span>
                                </div>
                                <ChevronRight size={18} className="text-gray-400" />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {paymentProviders?.manual_enabled && paymentProviders.manual.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                            <Banknote size={12} /> Manual Payments
                          </p>
                          <div className="grid gap-3">
                            {paymentProviders.manual.map(p => (
                              <label
                                key={p.id}
                                className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                  selectedPaymentProvider?.id === p.id
                                    ? 'border-orange-400 bg-orange-50 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <input
                                    type="radio"
                                    name="payment_method"
                                    checked={selectedPaymentProvider?.id === p.id}
                                    onChange={() => setSelectedPaymentProvider(p)}
                                    className="w-5 h-5 text-orange-500"
                                  />
                                  {p.logo_url && (
                                    <Image src={p.logo_url} alt={p.name} width={32} height={32} className="w-8 h-8 object-contain" />
                                  )}
                                  <div>
                                    <span className="font-medium text-gray-800">{p.name}</span>
                                    {p.category === 'bank' && (
                                      <p className="text-xs text-gray-400">Bank Transfer</p>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400" />
                              </label>
                            ))}
                          </div>
                          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-start gap-3">
                              <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-blue-800">How manual payment works</p>
                                <p className="text-xs text-blue-700 mt-1">
                                  After placing your order, you will receive payment instructions via email. 
                                  Transfer the amount to the provided account, then upload your proof of payment for verification. 
                                  Our team will verify your payment within 24 hours.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || items.length === 0}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock size={18} />
                          Complete Order • {formatCurrencyAmount(finalTotal, currency)}
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-24 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-orange-500" />
                    Order Summary
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Items List - FIXED: use priceUsd and currency conversion */}
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                    {items.map((item) => {
                      const itemPriceInSelectedCurrency = item.priceUsd * (rates[currency] ?? 1);
                      const totalItemPrice = itemPriceInSelectedCurrency * item.quantity;
                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.image_url && (
                              <Image src={item.image_url} alt={item.name} width={48} height={48} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-gray-800">
                            {formatCurrencyAmount(totalItemPrice, currency)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrencyAmount(subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span>{deliveryFee.toLocaleString()} MWK</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>- {discountAmount.toLocaleString()} MWK</span>
                      </div>
                    )}
                    {appliedPromo && (
                      <div className="flex justify-between text-xs text-gray-500 pt-1">
                        <span>Promo: {appliedPromo.code}</span>
                        <span>{appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}%` : `${appliedPromo.discount_value} MWK`}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-orange-600 text-xl">{formatCurrencyAmount(finalTotal, currency)}</span>
                    </div>
                  </div>

                  {selectedPaymentProvider?.type === 'manual' && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                      <div className="flex items-start gap-2">
                        <Clock size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-700">
                          After placing your order, you will be redirected to upload your payment proof.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedPaymentProvider?.type === 'automatic' && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-2">
                        <Smartphone size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">
                          A payment request will be sent to your phone. Authorize the payment to complete your order.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                      <Shield size={12} /> Secure checkout. Your information is protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
