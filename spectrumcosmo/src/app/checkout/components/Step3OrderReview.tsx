// app/checkout/components/Step3OrderReview.tsx
'use client';

import { CheckCircle, Truck, Package, CreditCard, Lock, Shield, User, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import { useCart } from '@/components/storefront/CartProvider';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import { formatCurrencyAmount } from '@/lib/currency';
import { CheckoutFormData, PaymentProvider, DeliveryMethod } from '@/lib/types/order';

interface Step3OrderReviewProps {
  form: CheckoutFormData;
  selectedDeliveryMethod: DeliveryMethod | null;
  selectedPaymentProvider: PaymentProvider | null;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  taxAmount: number;
  taxRate: number;
  taxName: string;
  finalTotal: number;
  requiresQuote: boolean;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function Step3OrderReview({
  form,
  selectedDeliveryMethod,
  selectedPaymentProvider,
  subtotal,
  deliveryFee,
  discountAmount,
  taxAmount,
  taxRate,
  taxName,
  finalTotal,
  requiresQuote,
  onConfirm,
  onBack,
  isSubmitting,
  error,
}: Step3OrderReviewProps) {
  const { items } = useCart();
  const { currency, rates } = useCurrency();

  return (
    <div className="space-y-6">
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Package size={18} className="text-[var(--primary)]" />
            Order Items ({items.length})
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-2">
            {items.map((item) => {
              const itemPrice = item.priceUsd * (rates[currency] ?? 1);
              const totalItemPrice = itemPrice * item.quantity;
              return (
                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-[var(--foreground)]">{item.name} x {item.quantity}</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {formatCurrencyAmount(totalItemPrice, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4">
          <h3 className="font-semibold text-[var(--foreground)] text-sm flex items-center gap-2 mb-3">
            <User size={16} className="text-[var(--primary)]" />
            Customer Details
          </h3>
          <div className="space-y-1.5 text-sm">
            <p className="text-[var(--foreground)]">{form.name}</p>
            <p className="text-[var(--foreground-muted)] flex items-center gap-1">
              <Phone size={12} className="text-[var(--foreground-muted)]" /> {form.phone}
            </p>
            <p className="text-[var(--foreground-muted)] flex items-center gap-1">
              <Mail size={12} className="text-[var(--foreground-muted)]" /> {form.email}
            </p>
          </div>
        </div>

        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4">
          <h3 className="font-semibold text-[var(--foreground)] text-sm flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-[var(--primary)]" />
            Delivery Details
          </h3>
          <div className="space-y-1.5 text-sm">
            <p className="text-[var(--foreground)]">{form.location}</p>
            <p className="text-[var(--foreground-muted)] flex items-center gap-1">
              <Truck size={12} className="text-[var(--foreground-muted)]" /> {selectedDeliveryMethod?.name || 'Not selected'}
            </p>
            {form.notes && (
              <p className="text-[var(--foreground-muted)] text-xs">Note: {form.notes}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4">
        <h3 className="font-semibold text-[var(--foreground)] text-sm flex items-center gap-2 mb-2">
          <CreditCard size={16} className="text-[var(--primary)]" />
          Payment Method
        </h3>
        <p className="text-[var(--foreground)]">{selectedPaymentProvider?.name || 'Not selected'}</p>
      </div>

      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-6">
        <h3 className="font-semibold text-[var(--foreground)] mb-4">Price Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">Subtotal</span>
            <span className="text-[var(--foreground)]">{formatCurrencyAmount(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">Delivery Fee</span>
            <span className="text-[var(--foreground)]">
              {requiresQuote ? 'Pending quote' : `${deliveryFee.toLocaleString()} MWK`}
            </span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-500">
              <span>Discount</span>
              <span>- {discountAmount.toLocaleString()} MWK</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">{taxName} ({taxRate}%)</span>
            <span className="text-[var(--foreground)]">{formatCurrencyAmount(taxAmount, currency)}</span>
          </div>
          <div className="border-t border-[var(--border)] pt-3 flex justify-between font-bold">
            <span className="text-[var(--foreground)]">Total</span>
            <span className="text-[var(--primary)] text-lg">
              {requiresQuote ? 'Pending quote' : formatCurrencyAmount(finalTotal, currency)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--foreground-muted)]">
        <div className="flex items-center gap-1">
          <Lock size={12} className="text-green-600 dark:text-green-400" />
          SSL Secure
        </div>
        <div className="w-px h-4 bg-[var(--border)]" />
        <div className="flex items-center gap-1">
          <Shield size={12} className="text-green-600 dark:text-green-400" />
          Buyer Protection
        </div>
        <div className="w-px h-4 bg-[var(--border)]" />
        <div className="flex items-center gap-1">
          <CheckCircle size={12} className="text-green-600 dark:text-green-400" />
          Verified Payment
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border-2 border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-[2] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
          {isSubmitting ? 'Placing Order...' : requiresQuote ? 'Request Quote' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
