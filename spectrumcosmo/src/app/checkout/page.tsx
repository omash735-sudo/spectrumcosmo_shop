'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { useCart } from '@/components/storefront/CartProvider';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import { formatCurrencyAmount } from '@/lib/currency';
import { 
  Loader2, Tag, Gift, X, CheckCircle, Info, Truck, 
  CreditCard, Shield, User, Mail, Phone, MapPin, 
  MessageSquare, ChevronRight, Lock, Sparkles, 
  Banknote, Smartphone, Clock, ArrowRight, ShoppingBag,
  Home, AlertTriangle, Send, Eye
} from 'lucide-react';
import Image from 'next/image';

// ============================================
// TYPES
// ============================================

interface DeliveryMethod {
  id: number;
  name: string;
  price: number;
  type: string;
  estimated_days?: string;
}

interface PaymentProvider {
  id: number;
  name: string;
  type: string;
  category: string;
  logo_url: string | null;
}

interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

interface SavedAddress {
  id: string;
  full_name: string;
  phone_number: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
}

interface DeliveryArea {
  id: number;
  area_name: string;
  city: string;
  base_fee: number;
  express_multiplier: number;
  estimated_days_standard: string | null;
  estimated_days_express: string | null;
}

interface ServiceabilityResponse {
  isServiceable: boolean;
  area: DeliveryArea | null;
  baseFee: number | null;
  estimatedDays: string | null;
  defaultFee?: number;
  message: string | null;
  requiresQuote: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateMalawiPhone = (phone: string): boolean => {
  return /^(099|088|098)\d{7}$/.test(phone);
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalUsd, clearCart, removeItem, updateQty } = useCart();
  const { currency, rates } = useCurrency();

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);

  // Delivery State
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [serviceability, setServiceability] = useState<ServiceabilityResponse | null>(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  const [requiresQuote, setRequiresQuote] = useState(false);
  const [quoteRequested, setQuoteRequested] = useState(false);

  // Payment State
  const [paymentProviders, setPaymentProviders] = useState<{
    automatic_enabled: boolean;
    manual_enabled: boolean;
    automatic: PaymentProvider[];
    manual: PaymentProvider[];
  } | null>(null);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProvider | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    notes: '',
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Promo & Referral State
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [savedReferral, setSavedReferral] = useState('');
  const [referralMessage, setReferralMessage] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState('');
  const [showOrderReview, setShowOrderReview] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [taxRate, setTaxRate] = useState(16.5);
  const [taxName, setTaxName] = useState('VAT');

  // ============================================
  // CALCULATIONS
  // ============================================

  const subtotal = useMemo(
    () => subtotalUsd * (rates[currency] ?? 1),
    [subtotalUsd, rates, currency]
  );

  const deliveryFee = useMemo(() => {
    if (requiresQuote) return 0;
    if (serviceability?.isServiceable && serviceability.baseFee && selectedDeliveryId) {
      const method = deliveryMethods.find(m => m.id === selectedDeliveryId);
      if (method?.type === 'express') {
        return serviceability.baseFee * (serviceability.area?.express_multiplier || 1.5);
      }
      return serviceability.baseFee;
    }
    return 0;
  }, [serviceability, selectedDeliveryId, deliveryMethods, requiresQuote]);

  const taxAmount = useMemo(() => {
    const taxableAmount = subtotal + deliveryFee - discountAmount;
    return (taxableAmount * taxRate) / 100;
  }, [subtotal, deliveryFee, discountAmount, taxRate]);

  const totalBeforeTax = subtotal + deliveryFee - discountAmount;
  const finalTotal = totalBeforeTax + taxAmount;

  // ============================================
  // CART ACTIONS - Using correct method names from CartProvider
  // ============================================

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
    } else {
      updateQty(productId, newQuantity);
    }
  };

  // ============================================
  // FETCH DATA
  // ============================================

  const fetchAuthStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setIsLoggedIn(true);
        setUserId(data.user.id);
        setForm(prev => ({
          ...prev,
          name: data.user.name || prev.name,
          email: data.user.email || prev.email,
          phone: data.user.phone || prev.phone,
        }));
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    }
  }, []);

  const fetchSavedAddresses = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch('/api/account/addresses');
      if (res.ok) {
        const addresses = await res.json();
        setSavedAddresses(addresses);
        const defaultAddress = addresses.find((a: SavedAddress) => a.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setForm(prev => ({
            ...prev,
            name: defaultAddress.full_name || prev.name,
            phone: defaultAddress.phone_number || prev.phone,
            location: `${defaultAddress.address_line1}, ${defaultAddress.city}`,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  }, [isLoggedIn]);

  const fetchDeliveryData = useCallback(async () => {
    try {
      const [methodsRes, areasRes, taxRes, paymentRes] = await Promise.all([
        fetch('/api/delivery-methods'),
        fetch('/api/delivery-areas'),
        fetch('/api/tax'),
        fetch('/api/payment-providers'),
      ]);

      if (methodsRes.ok) {
        const methods = await methodsRes.json();
        setDeliveryMethods(methods);
        if (methods.length > 0) setSelectedDeliveryId(methods[0].id);
      }

      if (areasRes.ok) {
        const areas = await areasRes.json();
        setDeliveryAreas(areas);
      }

      if (taxRes.ok) {
        const tax = await taxRes.json();
        setTaxRate(tax.rate);
        setTaxName(tax.name);
      }

      if (paymentRes.ok) {
        const data = await paymentRes.json();
        setPaymentProviders(data);
        if (data.automatic.length > 0 && data.automatic_enabled) {
          setSelectedPaymentProvider(data.automatic[0]);
        } else if (data.manual.length > 0 && data.manual_enabled) {
          setSelectedPaymentProvider(data.manual[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch delivery data:', err);
      toast.error('Failed to load checkout options');
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthStatus();
    fetchDeliveryData();
  }, [fetchAuthStatus, fetchDeliveryData]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSavedAddresses();
    }
  }, [isLoggedIn, fetchSavedAddresses]);

  // Check serviceability when location changes
  useEffect(() => {
    const checkServiceability = async () => {
      if (!form.location || form.location.length < 3 || !selectedDeliveryId) return;
      
      setCheckingServiceability(true);
      try {
        const res = await fetch('/api/delivery/check-serviceability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: form.location,
            deliveryMethodId: selectedDeliveryId,
          }),
        });
        const data = await res.json();
        setServiceability(data);
        setRequiresQuote(!data.isServiceable);
      } catch (err) {
        console.error('Serviceability check failed:', err);
      } finally {
        setCheckingServiceability(false);
      }
    };

    const timer = setTimeout(checkServiceability, 500);
    return () => clearTimeout(timer);
  }, [form.location, selectedDeliveryId]);

  // ============================================
  // FORM VALIDATION
  // ============================================

  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case 'name':
        return value.trim().length < 2 ? 'Full name is required' : '';
      case 'email':
        if (!value) return 'Email is required';
        if (!validateEmail(value)) return 'Enter a valid email address';
        return '';
      case 'phone':
        if (!value) return 'Phone number is required';
        if (!validateMalawiPhone(value)) return 'Enter a valid Malawi phone number (099 123 4567)';
        return '';
      case 'location':
        return value.trim().length < 5 ? 'Please enter your full delivery address' : '';
      default:
        return '';
    }
  }, []);

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error }));
    
    if (field === 'location') {
      setRequiresQuote(false);
      setQuoteRequested(false);
    }
  };

  const handleAddressSelect = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setForm({
      name: address.full_name,
      email: form.email,
      phone: address.phone_number,
      location: `${address.address_line1}, ${address.city}`,
      notes: form.notes,
    });
  };

  // ============================================
  // PROMO & REFERRAL
  // ============================================

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
          cartTotal: totalBeforeTax,
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
        setPromoSuccess(`${data.promoCode.code} applied! You saved MWK ${data.discountAmount.toLocaleString()}`);
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

  // ============================================
  // CHECKOUT SUBMISSION
  // ============================================

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    errors.name = validateField('name', form.name);
    errors.email = validateField('email', form.email);
    errors.phone = validateField('phone', form.phone);
    errors.location = validateField('location', form.location);
    
    setFormErrors(errors);
    return !Object.values(errors).some(e => e);
  };

  const handleQuoteRequest = async () => {
    if (!validateForm()) return;
    if (items.length === 0) {
      setError('Cart is empty');
      return;
    }
    if (!selectedDeliveryId) {
      setError('Please select a delivery method');
      return;
    }
    if (!selectedPaymentProvider) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const mappedItems = items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: Number(item.quantity),
        price_usd: Number(item.priceUsd ?? 0),
      }));

      const quotePayload = {
        customer_name: form.name,
        customer_email: form.email,
        phone_number: form.phone,
        location: form.location,
        notes: form.notes || null,
        items: mappedItems,
        subtotal: subtotal,
        delivery_method_id: selectedDeliveryId,
        delivery_method_name: deliveryMethods.find(m => m.id === selectedDeliveryId)?.name,
        payment_provider_id: selectedPaymentProvider.id,
        payment_method: selectedPaymentProvider.name,
      };

      const res = await fetch('/api/orders/request-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotePayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Quote request failed');
      }

      toast.success('Quote request submitted! Check your email for updates.');
      clearCart();
      router.push(`/order-status?order=${data.orderId}&quote=true`);
    } catch (err: any) {
      console.error('Quote request error:', err);
      setError(err.message || 'Could not submit quote request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;
    if (items.length === 0) {
      setError('Cart is empty');
      return;
    }
    if (!selectedDeliveryId) {
      setError('Please select a delivery method');
      return;
    }
    if (!selectedPaymentProvider) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const mappedItems = items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: Number(item.quantity),
        price_usd: Number(item.priceUsd ?? 0),
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
        tax_amount: taxAmount,
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

      // Save address if requested
      if (saveNewAddress && isLoggedIn && form.location) {
        try {
          await fetch('/api/account/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: form.name,
              phone_number: form.phone,
              email: form.email,
              address_line1: form.location,
              city: form.location.split(',')[1]?.trim() || 'Lilongwe',
              country: 'Malawi',
              is_default: savedAddresses.length === 0,
            }),
          });
        } catch (err) {
          console.error('Failed to save address:', err);
        }
      }

      // Create account if requested
      if (createAccount && !isLoggedIn) {
        try {
          const password = Math.random().toString(36).slice(-8);
          await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              password: password,
              acceptedTerms: true,
            }),
          });
          toast.success('Account created! Check your email for login details.');
        } catch (err) {
          console.error('Account creation failed:', err);
        }
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

        toast.success('Payment request sent to your phone');
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

  const handleProceedToReview = () => {
    if (!validateForm()) return;
    if (items.length === 0) {
      setError('Cart is empty');
      return;
    }
    if (!selectedDeliveryId) {
      setError('Please select a delivery method');
      return;
    }
    if (!selectedPaymentProvider) {
      setError('Please select a payment method');
      return;
    }
    if (requiresQuote && !quoteRequested) {
      setError('Please request a delivery quote first');
      return;
    }
    setShowOrderReview(true);
  };

  // Back button protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (appliedPromo || savedReferral || Object.values(form).some(v => v)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [appliedPromo, savedReferral, form]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const inputClasses = (fieldName: string) => `
    w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base
    ${focusedField === fieldName 
      ? 'border-orange-400 shadow-md ring-2 ring-orange-100' 
      : formErrors[fieldName] 
        ? 'border-red-300 bg-red-50' 
        : 'border-gray-200 hover:border-gray-300'
    }
    focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100
  `;

  if (loadingOptions) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-12 h-12 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const selectedDeliveryMethod = deliveryMethods.find(m => m.id === selectedDeliveryId);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Secure Checkout</h1>
            <p className="text-gray-500 text-sm sm:text-base mt-2">Complete your purchase with confidence</p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <div className="flex items-center gap-1 text-xs sm:text-sm text-green-600">
                <Lock size={14} /> 256-bit SSL Secure
              </div>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-green-600">
                <Shield size={14} /> Buyer Protection
              </div>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-green-600">
                <CreditCard size={14} /> PCI Compliant
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            
            {/* Left Column - Form */}
            <div className="flex-1 space-y-4 sm:space-y-6">
              {/* Login Prompt for Guests */}
              {!isLoggedIn && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <User size={20} className="text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Returning customer?</p>
                        <p className="text-xs text-blue-600">Sign in to use saved addresses</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* Address Section */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <MapPin size={18} className="text-orange-500" />
                    Delivery Address
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  {/* Saved Addresses */}
                  {isLoggedIn && savedAddresses.length > 0 && (
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Saved Addresses</label>
                      <div className="space-y-2">
                        {savedAddresses.map(addr => (
                          <label
                            key={addr.id}
                            className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition ${
                              selectedAddressId === addr.id
                                ? 'border-orange-400 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="saved_address"
                              checked={selectedAddressId === addr.id}
                              onChange={() => handleAddressSelect(addr)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 text-sm">
                              <p className="font-medium text-gray-900">{addr.full_name}</p>
                              <p className="text-gray-600">{addr.address_line1}</p>
                              <p className="text-gray-600">{addr.city}, {addr.country}</p>
                              <p className="text-gray-500 text-xs">Phone: {addr.phone_number}</p>
                            </div>
                            {addr.is_default && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">Default</span>
                            )}
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={() => setSelectedAddressId(null)}
                        className="text-sm text-orange-500 mt-2 hover:underline"
                      >
                        + Use a different address
                      </button>
                    </div>
                  )}

                  {/* Address Form */}
                  {(selectedAddressId === null || savedAddresses.length === 0) && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              onChange={e => handleFormChange('name', e.target.value)}
                              className={`${inputClasses('name')} pl-10`}
                              placeholder="Your full name"
                            />
                          </div>
                          {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
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
                              onChange={e => handleFormChange('phone', e.target.value)}
                              className={`${inputClasses('phone')} pl-10`}
                              placeholder="099 123 4567"
                            />
                          </div>
                          {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
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
                            onChange={e => handleFormChange('email', e.target.value)}
                            className={`${inputClasses('email')} pl-10`}
                            placeholder="yourmail@example.com"
                          />
                        </div>
                        {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
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
                            onChange={e => handleFormChange('location', e.target.value)}
                            className={`${inputClasses('location')} pl-10`}
                            placeholder="Lilongwe, Area 10, House 123"
                          />
                        </div>
                        {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                      </div>

                      {isLoggedIn && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={saveNewAddress}
                            onChange={e => setSaveNewAddress(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-600">Save this address to my account</span>
                        </label>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <MessageSquare size={16} /> Delivery Notes
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition resize-none"
                      placeholder="Gate code, landmark, special instructions..."
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Method Section */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Truck size={18} className="text-orange-500" />
                    Delivery Method
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="grid gap-3">
                    {deliveryMethods.map(method => (
                      <label
                        key={method.id}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedDeliveryId === method.id
                            ? 'border-orange-400 bg-orange-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-2 sm:mb-0">
                          <input
                            type="radio"
                            name="delivery_method"
                            checked={selectedDeliveryId === method.id}
                            onChange={() => setSelectedDeliveryId(method.id)}
                            className="w-5 h-5 text-orange-500 shrink-0"
                          />
                          <div>
                            <p className="font-medium text-gray-800 text-sm sm:text-base">{method.name}</p>
                            {serviceability?.estimatedDays && (
                              <p className="text-xs text-gray-400">Estimated {serviceability.estimatedDays}</p>
                            )}
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900 ml-9 sm:ml-0">
                          {deliveryFee > 0 ? `${deliveryFee.toLocaleString()} MWK` : 'Calculated at checkout'}
                        </p>
                      </label>
                    ))}
                  </div>

                  {/* Serviceability Status */}
                  {checkingServiceability && (
                    <div className="mt-4 flex items-center gap-2 text-gray-500">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">Checking delivery availability...</span>
                    </div>
                  )}

                  {!checkingServiceability && serviceability && !serviceability.isServiceable && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Out of Service Area</p>
                          <p className="text-sm text-yellow-700 mt-1">{serviceability.message}</p>
                          {!quoteRequested && (
                            <button
                              onClick={handleQuoteRequest}
                              disabled={loading}
                              className="mt-3 flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition"
                            >
                              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                              Request Delivery Quote
                            </button>
                          )}
                          {quoteRequested && (
                            <div className="mt-3 flex items-center gap-2 text-green-600">
                              <CheckCircle size={16} />
                              <span className="text-sm">Quote request submitted! Check your email.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <CreditCard size={18} className="text-orange-500" />
                    Payment Method
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  {paymentProviders?.automatic_enabled && paymentProviders.automatic.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Smartphone size={12} /> Instant Payment
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
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="radio"
                                name="payment_method"
                                checked={selectedPaymentProvider?.id === p.id}
                                onChange={() => setSelectedPaymentProvider(p)}
                                className="w-5 h-5 text-orange-500 shrink-0"
                              />
                              <span className="font-medium text-gray-800 text-sm sm:text-base">{p.name}</span>
                            </div>
                            <ChevronRight size={18} className="text-gray-400 shrink-0" />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {paymentProviders?.manual_enabled && paymentProviders.manual.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Banknote size={12} /> Manual Payment
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
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="radio"
                                name="payment_method"
                                checked={selectedPaymentProvider?.id === p.id}
                                onChange={() => setSelectedPaymentProvider(p)}
                                className="w-5 h-5 text-orange-500 shrink-0"
                              />
                              <span className="font-medium text-gray-800 text-sm sm:text-base">{p.name}</span>
                            </div>
                            <ChevronRight size={18} className="text-gray-400 shrink-0" />
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-start gap-3">
                          <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-700">
                            For manual payments, you'll receive payment instructions via email after placing your order.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Promo Code Section */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6">
                  {appliedPromo ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={18} className="text-green-600" />
                        <div>
                          <p className="font-semibold text-green-700">{appliedPromo.code}</p>
                          <p className="text-xs text-green-600">
                            {appliedPromo.discount_type === 'percentage' 
                              ? `${appliedPromo.discount_value}% off` 
                              : `${appliedPromo.discount_value.toLocaleString()} MWK off`}
                          </p>
                        </div>
                      </div>
                      <button onClick={removePromoCode} className="text-red-500 hover:text-red-600">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={promoCode}
                          onChange={e => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Promo code"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                      </div>
                      <button
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
              </div>

              {/* Referral Code Section */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6">
                  {savedReferral ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <Gift size={18} className="text-blue-600" />
                        <div>
                          <p className="font-semibold text-blue-700">Referral: {savedReferral}</p>
                          <p className="text-xs text-blue-600">Friend gets credit after your purchase</p>
                        </div>
                      </div>
                      <button onClick={() => { setSavedReferral(''); setReferralMessage(''); }} className="text-red-500 hover:text-red-600">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Gift size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={referralCode}
                          onChange={e => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="Referral code"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                        />
                      </div>
                      <button
                        onClick={saveReferralCode}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                      >
                        Save
                      </button>
                    </div>
                  )}
                  {referralMessage && <p className="text-green-500 text-sm mt-2">{referralMessage}</p>}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {!requiresQuote && !quoteRequested && (
                <button
                  onClick={handleProceedToReview}
                  disabled={loading || items.length === 0 || !serviceability?.isServiceable}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-200 text-base sm:text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Eye size={18} />
                      Review Order
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              )}

              {requiresQuote && !quoteRequested && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <p className="text-yellow-800 text-sm mb-3">
                    Please request a delivery quote to continue
                  </p>
                  <button
                    onClick={handleQuoteRequest}
                    disabled={loading}
                    className="bg-yellow-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-yellow-700 transition"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    Request Delivery Quote
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:w-96 xl:w-[400px]">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 sticky top-24 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                  <h2 className="font-bold text-base sm:text-lg text-gray-800 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-orange-500" />
                    Order Summary
                    <span className="text-xs text-gray-400 ml-1">({items.length} items)</span>
                  </h2>
                </div>
                
                <div className="p-4 sm:p-6">
                  {/* Items List with Edit */}
                  <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                    {items.map((item) => {
                      const itemPrice = item.priceUsd * (rates[currency] ?? 1);
                      const totalItemPrice = itemPrice * item.quantity;
                      return (
                        <div key={item.id} className="flex gap-3 items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.image_url && (
                              <Image src={item.image_url} alt={item.name} width={48} height={48} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                              >
                                -
                              </button>
                              <span className="text-xs text-gray-600">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-gray-800 whitespace-nowrap">
                            {formatCurrencyAmount(totalItemPrice, currency)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {items.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Your cart is empty</p>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrencyAmount(subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Delivery Fee</span>
                      <span>
                        {requiresQuote 
                          ? 'Quote pending' 
                          : deliveryFee > 0 
                            ? `${deliveryFee.toLocaleString()} MWK` 
                            : 'Calculated at checkout'}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>- {discountAmount.toLocaleString()} MWK</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{taxName} ({taxRate}%)</span>
                      <span>{formatCurrencyAmount(taxAmount, currency)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-orange-600 text-lg sm:text-xl">
                        {requiresQuote ? 'Quote pending' : formatCurrencyAmount(finalTotal, currency)}
                      </span>
                    </div>
                  </div>

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

      {/* Order Review Modal */}
      {showOrderReview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Your Order</h2>
              <button onClick={() => setShowOrderReview(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-5 max-h-[calc(90vh-70px)]">
              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span className="font-medium">
                        {formatCurrencyAmount(item.priceUsd * (rates[currency] ?? 1) * item.quantity, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Delivery Details</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
                  <p><span className="text-gray-500">Name:</span> {form.name}</p>
                  <p><span className="text-gray-500">Phone:</span> {form.phone}</p>
                  <p><span className="text-gray-500">Email:</span> {form.email}</p>
                  <p><span className="text-gray-500">Address:</span> {form.location}</p>
                  <p><span className="text-gray-500">Method:</span> {selectedDeliveryMethod?.name}</p>
                  {form.notes && <p><span className="text-gray-500">Notes:</span> {form.notes}</p>}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <p className="text-sm">{selectedPaymentProvider?.name}</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Price Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrencyAmount(subtotal, currency)}</span></div>
                  <div className="flex justify-between"><span>Delivery Fee</span><span>{deliveryFee.toLocaleString()} MWK</span></div>
                  {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>- {discountAmount.toLocaleString()} MWK</span></div>}
                  <div className="flex justify-between"><span>{taxName} ({taxRate}%)</span><span>{formatCurrencyAmount(taxAmount, currency)}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span className="text-orange-600">{formatCurrencyAmount(finalTotal, currency)}</span></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowOrderReview(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                >
                  Edit Order
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                  Confirm & Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button Warning Modal */}
      {showBackWarning && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Leave Checkout?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                If you leave now, you may lose your applied promo code and discount.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBackWarning(false)}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Stay on Checkout
                </button>
                <button
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Leave Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
