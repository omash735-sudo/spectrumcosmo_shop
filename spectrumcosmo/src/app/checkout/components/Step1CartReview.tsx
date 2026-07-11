// app/checkout/components/Step1CartReview.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Tag, Gift, X, CheckCircle, Loader2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/storefront/CartProvider';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import { formatCurrencyAmount } from '@/lib/currency';
import { PromoCode } from '@/lib/types/order';

interface Step1CartReviewProps {
  onNext: () => void;
  appliedPromo: PromoCode | null;
  discountAmount: number;
  onApplyPromo: (code: string) => Promise<void>;
  onRemovePromo: () => void;
  onSaveReferral: (code: string) => void;
  savedReferral: string | null;
  isSubmitting: boolean;
  error: string | null;
}

export default function Step1CartReview({
  onNext,
  appliedPromo,
  discountAmount,
  onApplyPromo,
  onRemovePromo,
  onSaveReferral,
  savedReferral,
  isSubmitting,
  error,
}: Step1CartReviewProps) {
  const { items, totalItems, subtotalUsd } = useCart();
  const { currency, rates } = useCurrency();
  const [promoCode, setPromoCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  const subtotal = subtotalUsd * (rates[currency] ?? 1);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setPromoLoading(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      await onApplyPromo(promoCode);
      setPromoSuccess(`Promo code applied!`);
      setPromoCode('');
    } catch (err: any) {
      setPromoError(err.message || 'Invalid promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSaveReferral = () => {
    if (!referralCode.trim()) {
      return;
    }
    onSaveReferral(referralCode);
    setReferralCode('');
  };

  const isEmpty = items.length === 0;

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <ShoppingBag size={18} className="text-[var(--primary)]" />
            Cart Items ({totalItems})
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          {isEmpty ? (
            <div className="text-center py-8 text-[var(--foreground-muted)]">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {items.map((item) => {
                const itemPrice = item.priceUsd * (rates[currency] ?? 1);
                const totalItemPrice = itemPrice * item.quantity;
                return (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 bg-[var(--background-secondary)] rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url && (
                        <Image src={item.image_url} alt={item.name} width={48} height={48} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.name}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-[var(--foreground)] whitespace-nowrap">
                      {formatCurrencyAmount(totalItemPrice, currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--foreground-muted)]">Subtotal</span>
              <span className="text-[var(--foreground)] font-medium">{formatCurrencyAmount(subtotal, currency)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-500">
                <span>Discount</span>
                <span>- {discountAmount.toLocaleString()} MWK</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-[var(--border)]">
              <span className="text-[var(--foreground)]">Total</span>
              <span className="text-[var(--primary)]">{formatCurrencyAmount(subtotal - discountAmount, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Code */}
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-6">
        {appliedPromo ? (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-green-600 dark:text-green-500" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400">{appliedPromo.code}</p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  {appliedPromo.discount_type === 'percentage' 
                    ? `${appliedPromo.discount_value}% off` 
                    : `${appliedPromo.discount_value.toLocaleString()} MWK off`}
                </p>
              </div>
            </div>
            <button onClick={onRemovePromo} className="text-red-500 hover:text-red-600">
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Promo code"
                className="w-full pl-10 pr-4 py-3 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
              />
            </div>
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading}
              className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-medium transition disabled:opacity-50 whitespace-nowrap"
            >
              {promoLoading ? <Loader2 className="animate-spin" size={18} /> : 'Apply'}
            </button>
          </div>
        )}
        {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
        {promoSuccess && <p className="text-green-500 text-sm mt-2">{promoSuccess}</p>}
      </div>

      {/* Referral Code */}
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-6">
        {savedReferral ? (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <Gift size={18} className="text-blue-600 dark:text-blue-500" />
              <div>
                <p className="font-semibold text-blue-700 dark:text-blue-400">Referral: {savedReferral}</p>
                <p className="text-xs text-blue-600 dark:text-blue-500">Friend gets credit after your purchase</p>
              </div>
            </div>
            <button onClick={() => onSaveReferral('')} className="text-red-500 hover:text-red-600">
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Gift size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Referral code"
                className="w-full pl-10 pr-4 py-3 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
              />
            </div>
            <button
              onClick={handleSaveReferral}
              className="px-6 py-3 bg-[var(--background-secondary)] hover:bg-[var(--border)] text-[var(--foreground)] rounded-xl font-medium transition whitespace-nowrap"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={isEmpty || isSubmitting}
        className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-4 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20 text-base"
      >
        Continue to Details
      </button>
    </div>
  );
}
