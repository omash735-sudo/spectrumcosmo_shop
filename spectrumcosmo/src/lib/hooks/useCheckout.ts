// lib/hooks/useCheckout.ts
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  CheckoutState, 
  CheckoutFormData, 
  ServiceabilityResponse,
  PromoCode,
  PaymentProvider,
  DeliveryMethod
} from '@/lib/types/order';
import { orderService } from '@/lib/services/orderService';

const initialForm: CheckoutFormData = {
  name: '',
  email: '',
  phone: '',
  location: '',
  notes: '',
};

const initialState: CheckoutState = {
  step: 1,
  form: initialForm,
  selectedDeliveryMethodId: null,
  selectedPaymentProvider: null,
  serviceability: null,
  isCheckingServiceability: false,
  requiresQuote: false,
  quoteRequested: false,
  appliedPromo: null,
  discountAmount: 0,
  referralCode: null,
  savedReferral: null,
  isSubmitting: false,
  error: null,
};

export function useCheckout() {
  const router = useRouter();
  const [state, setState] = useState<CheckoutState>(initialState);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [paymentProviders, setPaymentProviders] = useState<{ automatic: any[]; manual: any[] } | null>(null);

  // Step navigation
  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      const next = Math.min(prev.step + 1, 4) as 1 | 2 | 3 | 4;
      return { ...prev, step: next };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => {
      const prevStep = Math.max(prev.step - 1, 1) as 1 | 2 | 3 | 4;
      return { ...prev, step: prevStep };
    });
  }, []);

  // Form updates
  const updateForm = useCallback((field: keyof CheckoutFormData, value: string) => {
    setState(prev => ({
      ...prev,
      form: { ...prev.form, [field]: value },
      error: null,
    }));
  }, []);

  // Delivery method selection
  const selectDeliveryMethod = useCallback((methodId: number) => {
    setState(prev => ({
      ...prev,
      selectedDeliveryMethodId: methodId,
    }));
  }, []);

  // Payment provider selection
  const selectPaymentProvider = useCallback((provider: PaymentProvider) => {
    setState(prev => ({
      ...prev,
      selectedPaymentProvider: provider,
    }));
  }, []);

  // Check serviceability
  const checkServiceability = useCallback(async (location: string, deliveryMethodId: number) => {
    if (!location || location.length < 3 || !deliveryMethodId) return;

    setState(prev => ({ ...prev, isCheckingServiceability: true, error: null }));

    try {
      const data = await orderService.checkServiceability(location, deliveryMethodId);
      setState(prev => ({
        ...prev,
        serviceability: data,
        requiresQuote: data.requiresQuote || false,
        isCheckingServiceability: false,
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        serviceability: {
          isServiceable: true,
          area: null,
          baseFee: 5000,
          estimatedDays: '2-3 days',
          message: null,
          requiresQuote: false,
        },
        requiresQuote: false,
        isCheckingServiceability: false,
        error: err.message || 'Failed to check serviceability',
      }));
    }
  }, []);

  // Promo code
  const applyPromo = useCallback(async (code: string, cartTotal: number, productIds: string[]) => {
    if (!code.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a promo code' }));
      return;
    }

    try {
      const data = await orderService.validatePromo(code, cartTotal, productIds);
      setState(prev => ({
        ...prev,
        appliedPromo: data.promoCode,
        discountAmount: data.discountAmount,
        error: null,
      }));
      toast.success(`Promo code applied! You saved MWK ${data.discountAmount.toLocaleString()}`);
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
      toast.error(err.message);
    }
  }, []);

  const removePromo = useCallback(() => {
    setState(prev => ({
      ...prev,
      appliedPromo: null,
      discountAmount: 0,
      error: null,
    }));
  }, []);

  // Referral code
  const saveReferral = useCallback((code: string) => {
    if (!code.trim()) {
      setState(prev => ({ ...prev, savedReferral: null }));
      return;
    }
    setState(prev => ({ ...prev, savedReferral: code.toUpperCase() }));
    toast.success(`Referral code ${code.toUpperCase()} saved!`);
  }, []);

  // Quote request
  const requestQuote = useCallback(async (
    payload: any,
    onSuccess?: (orderId: string) => void
  ) => {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const result = await orderService.requestQuote(payload);
      setState(prev => ({
        ...prev,
        quoteRequested: true,
        isSubmitting: false,
      }));
      toast.success('Quote request submitted! Check your email for updates.');
      if (onSuccess) onSuccess(result.orderId);
      return result;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: err.message,
      }));
      toast.error(err.message);
      throw err;
    }
  }, []);

  // Create order
  const createOrder = useCallback(async (
    payload: any,
    onSuccess?: (orderId: string) => void
  ) => {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const result = await orderService.createOrder(payload);
      setState(prev => ({ ...prev, isSubmitting: false }));
      toast.success('Order created successfully!');
      if (onSuccess) onSuccess(result.id);
      return result;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: err.message,
      }));
      toast.error(err.message);
      throw err;
    }
  }, []);

  // Reset
  const resetCheckout = useCallback(() => {
    setState(initialState);
  }, []);

  // Computed values
  const deliveryFee = useMemo(() => {
    if (state.requiresQuote) return 0;
    if (state.serviceability?.isServiceable && state.serviceability.baseFee && state.selectedDeliveryMethodId) {
      const method = deliveryMethods.find(m => m.id === state.selectedDeliveryMethodId);
      if (method?.type === 'express') {
        return state.serviceability.baseFee * (state.serviceability.area?.express_multiplier || 1.5);
      }
      return state.serviceability.baseFee;
    }
    return 0;
  }, [state.serviceability, state.selectedDeliveryMethodId, deliveryMethods, state.requiresQuote]);

  const canProceed = useMemo(() => {
    const { step, form, selectedDeliveryMethodId, selectedPaymentProvider, requiresQuote, quoteRequested } = state;
    
    switch (step) {
      case 1:
        return true; // Cart review always has items
      case 2:
        return !!(form.name && form.email && form.phone && form.location && selectedDeliveryMethodId);
      case 3:
        if (requiresQuote) return quoteRequested && !!selectedPaymentProvider;
        return !!selectedPaymentProvider;
      case 4:
        return true;
      default:
        return false;
    }
  }, [state]);

  return {
    state,
    deliveryMethods,
    setDeliveryMethods,
    paymentProviders,
    setPaymentProviders,
    deliveryFee,
    canProceed,
    // Actions
    goToStep,
    nextStep,
    prevStep,
    updateForm,
    selectDeliveryMethod,
    selectPaymentProvider,
    checkServiceability,
    applyPromo,
    removePromo,
    saveReferral,
    requestQuote,
    createOrder,
    resetCheckout,
  };
}
