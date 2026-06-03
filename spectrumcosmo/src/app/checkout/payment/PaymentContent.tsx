'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Tag, Gift, X, CheckCircle, AlertCircle, ArrowRight, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(5000);
  const [total, setTotal] = useState(0);
  
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
  
  // Order placement
  const [placingOrder, setPlacingOrder] = useState(false);

  // Load cart
  useEffect(() => {
    const loadCart = async () => {
      try {
        const res = await fetch('/api/cart');
        const data = await res.json();
        if (data.items) {
          setCartItems(data.items);
          const cartSubtotal = data.items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
          setSubtotal(cartSubtotal);
          setTotal(cartSubtotal + shipping);
        }
      } catch (err) {
        console.error('Failed to load cart:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, []);

  // Update total when discount changes
  useEffect(() => {
    setTotal(Math.max(0, subtotal + shipping - discountAmount));
  }, [subtotal, shipping, discountAmount]);

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
          cartTotal: subtotal + shipping,
          productIds: cartItems.map(item => item.product_id),
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
        setTotal(data.finalTotal);
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
    setTotal(subtotal + shipping);
    setPromoSuccess('');
  };

  // Save referral code
  const saveReferralCode = () => {
    if (!referralCode.trim()) {
      setReferralMessage('');
      return;
    }
    setSavedReferral(referralCode.toUpperCase());
    setReferralMessage(`Referral code ${referralCode.toUpperCase()} saved. Your friend will get credit after your purchase.`);
    setReferralCode('');
  };

  // Place order
  const placeOrder = async () => {
    setPlacingOrder(true);
    
    try {
      // Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          subtotal: subtotal,
          shipping: shipping,
          discountAmount: discountAmount,
          total: total,
          promoCodeId: appliedPromo?.id,
          referralCode: savedReferral || null,
        }),
      });

      if (!orderRes.ok) {
        const error = await orderRes.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const order = await orderRes.json();

      // Record promo code usage if applied
      if (appliedPromo && discountAmount > 0) {
        await fetch('/api/apply-promo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            promoCodeId: appliedPromo.id,
            discountAmount: discountAmount,
          }),
        });
      }

      // Track referral if used
      if (savedReferral) {
        await fetch('/api/referrals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode: savedReferral,
            orderId: order.id,
          }),
        });
      }

      // Clear cart and redirect to payment
      await fetch('/api/cart/clear', { method: 'DELETE' });
      router.push(`/payment?orderId=${order.id}`);
    } catch (err: any) {
      console.error('Order failed:', err);
      alert(err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Update quantity
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      });
      // Reload cart
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.items) {
        setCartItems(data.items);
        const cartSubtotal = data.items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
        setSubtotal(cartSubtotal);
        setTotal(cartSubtotal + shipping - discountAmount);
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  // Remove item
  const removeItem = async (itemId: string) => {
    try {
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.items) {
        setCartItems(data.items);
        const cartSubtotal = data.items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
        setSubtotal(cartSubtotal);
        setTotal(cartSubtotal + shipping - discountAmount);
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
        </main>
        <Footer />
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center py-12">
          <div className="text-center max-w-md mx-auto px-4">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
            <p className="text-gray-500 mb-6">Looks like you haven't added any items yet.</p>
            <button
              onClick={() => router.push('/products')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 mx-auto"
            >
              Start Shopping <ArrowRight size={18} />
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* LEFT COLUMN - Order Items + Promo Code + Referral */}
            <div className="flex-1 space-y-4">
              {/* Order Items Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-orange-500" />
                    Order Items ({cartItems.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-4 flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {item.image_url && (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{item.name}</h3>
                        <p className="text-orange-600 font-semibold mt-1">{item.price.toLocaleString()} MWK</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-lg hover:bg-gray-100 transition"
                          >
                            <Minus size={14} className="text-gray-500" />
                          </button>
                          <span className="text-sm text-gray-600 w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-lg hover:bg-gray-100 transition"
                          >
                            <Plus size={14} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto p-1 text-gray-400 hover:text-red-500 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{(item.price * item.quantity).toLocaleString()} MWK</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promo Code Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Tag size={18} className="text-orange-500" />
                    Promo Code
                  </h2>
                </div>
                <div className="p-5">
                  {appliedPromo ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <p className="text-green-700 font-medium">{appliedPromo.code} applied</p>
                        <p className="text-sm text-green-600">
                          {appliedPromo.discount_type === 'percentage' 
                            ? `${appliedPromo.discount_value}% off` 
                            : `${appliedPromo.discount_value.toLocaleString()} MWK off`}
                        </p>
                      </div>
                      <button
                        onClick={removePromoCode}
                        className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter promo code (e.g., SUMMER20)"
                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <button
                        onClick={applyPromoCode}
                        disabled={promoLoading}
                        className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition disabled:opacity-50 font-medium"
                      >
                        {promoLoading ? <Loader2 className="animate-spin" size={18} /> : 'Apply'}
                      </button>
                    </div>
                  )}
                  {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
                  {promoSuccess && <p className="text-green-500 text-sm mt-2">{promoSuccess}</p>}
                  <p className="text-xs text-gray-400 mt-3">Have a discount code? Enter it above to save on your order.</p>
                </div>
              </div>

              {/* Referral Code Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Gift size={18} className="text-orange-500" />
                    Referral Code (Optional)
                  </h2>
                </div>
                <div className="p-5">
                  {savedReferral ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-blue-700 font-medium">Referral code saved</p>
                      <p className="text-sm text-blue-600 mt-1">
                        Code: {savedReferral}
                      </p>
                      <p className="text-xs text-blue-500 mt-2">
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
                          placeholder="Enter friend's referral code (e.g., JOHN123)"
                          className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <button
                          onClick={saveReferralCode}
                          className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                        >
                          Save
                        </button>
                      </div>
                      {referralMessage && <p className="text-green-500 text-sm mt-2">{referralMessage}</p>}
                      <p className="text-xs text-gray-400 mt-3">
                        Have a friend's referral code? Enter it to support them. They will earn rewards when you complete your purchase.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Order Summary */}
            <div className="lg:w-96">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">Order Summary</h2>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{subtotal.toLocaleString()} MWK</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{shipping.toLocaleString()} MWK</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{discountAmount.toLocaleString()} MWK</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-orange-600 text-xl">{total.toLocaleString()} MWK</span>
                  </div>

                  <button
                    onClick={placeOrder}
                    disabled={placingOrder}
                    className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {placingOrder ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Processing...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-3">
                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
