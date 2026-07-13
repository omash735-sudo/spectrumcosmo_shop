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

  const [customDeliveryMethod, setCustomDeliveryMethod] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(16.5);
  const [taxName, setTaxName] = useState('VAT');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const subtotal = subtotalUsd * (rates[currency] ?? 1);

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [methods, providers, taxRes] = await Promise.all([
          orderService.fetchDeliveryMethods(),
          orderService.fetchPaymentProviders(),
          fetch('/api/tax'),
        ]);

        if (methods.length > 0) {
          setDeliveryMethods(methods);
          selectDeliveryMethod(methods[0].id);
        }

        if (providers) {
          setPaymentProviders(providers);
          if (providers.automatic.length > 0) {
            selectPaymentProvider(providers.automatic[0]);
          } else if (providers.manual.length > 0) {
            selectPaymentProvider(providers.manual[0]);
          }
        }

        if (taxRes.ok) {
          const tax = await taxRes.json();
          setTaxRate(tax.rate);
          setTaxName(tax.name);
        }
      } catch (err) {
        console.error('Failed to load checkout options:', err);
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  const taxAmount = useMemo(() => {
    const taxableAmount = subtotal + deliveryFee - state.discountAmount;
    return (taxableAmount * taxRate) / 100;
  }, [subtotal, deliveryFee, state.discountAmount, taxRate]);

  const finalTotal = useMemo(() => {
    return subtotal + deliveryFee - state.discountAmount + taxAmount;
  }, [subtotal, deliveryFee, state.discountAmount, taxAmount]);

  const selectedDeliveryMethod = deliveryMethods.find(m => m.id === state.selectedDeliveryMethodId) || null;
  const selectedPaymentProvider = state.selectedPaymentProvider;

  const handleConfirmOrder = useCallback(async () => {
    const { form, selectedDeliveryMethodId, selectedPaymentProvider, appliedPromo, savedReferral, discountAmount } = state;

    if (!selectedDeliveryMethodId) {
      toast.error('Please select a delivery method');
      return;
    }

    if (selectedDeliveryMethodId === -1 && !customDeliveryMethod?.trim()) {
      toast.error('Please enter the courier name');
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

    const deliveryMethodName = selectedDeliveryMethodId === -1 
      ? customDeliveryMethod || 'Other Courier'
      : selectedDeliveryMethod?.name || 'Standard';

    const payload = {
      customer_name: form.name,
      customer_email: form.email,
      phone_number: form.phone,
      location: form.location,
      notes: form.notes || null,
      items: mappedItems,
      subtotal: subtotal,
      delivery_method_id: selectedDeliveryMethodId === -1 ? null : selectedDeliveryMethodId,
      delivery_method_name: deliveryMethodName,
      custom_delivery_method: selectedDeliveryMethodId === -1 ? customDeliveryMethod : null,
      delivery_fee: deliveryFee,
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
  }, [state, items, subtotal, deliveryFee, taxAmount, finalTotal, customDeliveryMethod, selectedDeliveryMethod, createOrder, clearCart, resetCheckout, router]);

  if (loadingOptions) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--foreground-muted)]">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isEmpty = items.length === 0;

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
                  deliveryMethods={deliveryMethods}
                  selectedDeliveryMethodId={state.selectedDeliveryMethodId}
                  onSelectDeliveryMethod={selectDeliveryMethod}
                  customDeliveryMethod={customDeliveryMethod}
                  onCustomDeliveryMethodChange={setCustomDeliveryMethod}
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
                  selectedDeliveryMethod={selectedDeliveryMethod}
                  customDeliveryMethod={customDeliveryMethod}
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
