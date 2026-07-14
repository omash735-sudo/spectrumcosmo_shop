'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/storefront/CartProvider';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import CheckoutStepper from './components/CheckoutStepper';
import Step1CartReview from './components/Step1CartReview';
import Step2CustomerInfo from './components/Step2CustomerInfo';
import Step3OrderReview from './components/Step3OrderReview';
import { useCheckout } from '@/lib/hooks/useCheckout';
import { orderService } from '@/lib/services/orderService';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalUsd, clearCart } = useCart();
  const { currency, rates } = useCurrency();
  const {
    state,
    deliveryMethods,
    setDeliveryMethods,
    paymentProviders,
    setPaymentProviders,
    deliveryFee,
    nextStep,
    prevStep,
    updateForm,
    selectDeliveryMethod,
    selectPaymentProvider,
    applyPromo,
    removePromo,
    saveReferral,
    createOrder,
    resetCheckout,
  } = useCheckout();

  const [preferredCourier, setPreferredCourier] = useState('');
  const [taxRate, setTaxRate] = useState(16.5);
  const [taxName, setTaxName] = useState('VAT');
  const [loadingDeliveryMethods, setLoadingDeliveryMethods] = useState(true);
  const [loadingPaymentProviders, setLoadingPaymentProviders] = useState(true);
  const [loadingTax, setLoadingTax] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const subtotal = subtotalUsd * (rates[currency] ?? 1);

  // Load delivery methods independently
  useEffect(() => {
    const loadDeliveryMethods = async () => {
      try {
        const methods = await orderService.fetchDeliveryMethods();
        if (methods.length > 0) {
          setDeliveryMethods(methods);
          selectDeliveryMethod(methods[0].id);
        }
      } catch (err) {
        console.error('Failed to load delivery methods:', err);
      } finally {
        setLoadingDeliveryMethods(false);
      }
    };
    loadDeliveryMethods();
  }, []);

  // Load payment providers independently
  useEffect(() => {
    const loadPaymentProviders = async () => {
      try {
        const providers = await orderService.fetchPaymentProviders();
        if (providers) {
          setPaymentProviders(providers);
          if (providers.automatic?.length > 0) {
            selectPaymentProvider(providers.automatic[0]);
          } else if (providers.manual?.length > 0) {
            selectPaymentProvider(providers.manual[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load payment providers:', err);
      } finally {
        setLoadingPaymentProviders(false);
      }
    };
    loadPaymentProviders();
  }, []);

  // Load tax rate independently
  useEffect(() => {
    const loadTax = async () => {
      try {
        const taxRes = await fetch('/api/tax');
        if (taxRes.ok) {
          const tax = await taxRes.json();
          setTaxRate(tax.rate);
          setTaxName(tax.name);
        }
      } catch (err) {
        console.error('Failed to load tax rate:', err);
      } finally {
        setLoadingTax(false);
      }
    };
    loadTax();
  }, []);

  const taxAmount = useMemo(() => {
    const taxableAmount = subtotal + deliveryFee - state.discountAmount;
    return (taxableAmount * taxRate) / 100;
  }, [subtotal, deliveryFee, state.discountAmount, taxRate]);

  const finalTotal = useMemo(() => {
    return subtotal + deliveryFee - state.discountAmount + taxAmount;
  }, [subtotal, deliveryFee, state.discountAmount, taxAmount]);

  const selectedPaymentProvider = state.selectedPaymentProvider;

  const handleConfirmOrder = useCallback(async () => {
    const { form, selectedPaymentProvider, appliedPromo, savedReferral, discountAmount } = state;

    if (!preferredCourier.trim()) {
      toast.error('Please enter your preferred courier');
      return;
    }

    if (!selectedPaymentProvider) {
      toast.error('Please select a payment method');
      return;
    }

    setIsCreatingOrder(true);

    const mappedItems = items.map(item => ({
      product_id: item.id,
      product_name: item.name,
      quantity: Number(item.quantity),
      price_usd: Number(item.priceUsd ?? 0),
    }));

    const payload = {
      customer_name: form.name,
      customer_email: form.email,
      phone_number: form.phone,
      location: form.location,
      notes: form.notes || null,
      items: mappedItems,
      subtotal: subtotal,
      custom_delivery_method: preferredCourier,
      delivery_fee: 0,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: finalTotal,
      payment_provider_id: selectedPaymentProvider?.id || null,
      payment_method: selectedPaymentProvider?.name || 'Manual',
      promo_code_id: appliedPromo?.id || null,
      promo_code: appliedPromo?.code || null,
      referral_code: savedReferral || null,
    };

    try {
      const result = await createOrder(payload);
      if (result) {
        clearCart();
        resetCheckout();
        router.push(`/checkout/payment?orderId=${result.id}`);
      }
    } catch (err) {
      console.error('Order creation error:', err);
    } finally {
      setIsCreatingOrder(false);
    }
  }, [state, items, subtotal, taxAmount, finalTotal, preferredCourier, createOrder, clearCart, resetCheckout, router]);

  const isEmpty = items.length === 0;

  // Show delivery methods as empty array while loading
  const displayDeliveryMethods = deliveryMethods.length > 0 ? deliveryMethods : [];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">Secure Checkout</h1>
            <p className="text-[var(--foreground-muted)] text-sm mt-1">Complete your purchase with confidence</p>
          </div>

          <CheckoutStepper currentStep={state.step} />

          {isEmpty && state.step === 1 ? (
            <div className="text-center py-12 bg-[var(--background-card)] rounded-xl border border-[var(--border)]">
              <p className="text-[var(--foreground-muted)]">Your cart is empty</p>
              <button
                onClick={() => router.push('/products')}
                className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
              >
                Continue Shopping →
              </button>
            </div>
          ) : (
            <>
              {state.step === 1 && (
                <Step1CartReview
                  onNext={nextStep}
                  appliedPromo={state.appliedPromo}
                  discountAmount={state.discountAmount}
                  onApplyPromo={(code) => applyPromo(code, subtotal, items.map(i => i.id))}
                  onRemovePromo={removePromo}
                  onSaveReferral={saveReferral}
                  savedReferral={state.savedReferral}
                  isSubmitting={state.isSubmitting}
                  error={state.error}
                />
              )}

              {state.step === 2 && (
                <Step2CustomerInfo
                  form={state.form}
                  onUpdateForm={updateForm}
                  preferredCourier={preferredCourier}
                  onPreferredCourierChange={setPreferredCourier}
                  paymentProviders={paymentProviders}
                  selectedPaymentProvider={selectedPaymentProvider}
                  onSelectPaymentProvider={selectPaymentProvider}
                  onNext={nextStep}
                  onPrev={prevStep}
                  isSubmitting={state.isSubmitting}
                  error={state.error}
                />
              )}

              {state.step === 3 && (
                <Step3OrderReview
                  form={state.form}
                  customDeliveryMethod={preferredCourier}
                  selectedPaymentProvider={selectedPaymentProvider}
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  discountAmount={state.discountAmount}
                  taxAmount={taxAmount}
                  taxRate={taxRate}
                  taxName={taxName}
                  finalTotal={finalTotal}
                  onConfirm={handleConfirmOrder}
                  onBack={prevStep}
                  isSubmitting={isCreatingOrder || state.isSubmitting}
                  error={state.error}
                />
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
