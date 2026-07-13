'use client';

import { useState } from 'react';
import { User, Mail, Phone, MapPin, MessageSquare, Truck, CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CheckoutFormData, PaymentProvider } from '@/lib/types/order';

interface Step2CustomerInfoProps {
  form: CheckoutFormData;
  onUpdateForm: (field: keyof CheckoutFormData, value: string) => void;
  preferredCourier: string;
  onPreferredCourierChange: (value: string) => void;
  paymentProviders: { automatic: PaymentProvider[]; manual: PaymentProvider[] } | null;
  selectedPaymentProvider: PaymentProvider | null;
  onSelectPaymentProvider: (provider: PaymentProvider) => void;
  onNext: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function Step2CustomerInfo({
  form,
  onUpdateForm,
  preferredCourier,
  onPreferredCourierChange,
  paymentProviders,
  selectedPaymentProvider,
  onSelectPaymentProvider,
  onNext,
  onPrev,
  isSubmitting,
  error,
}: Step2CustomerInfoProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        return value.trim().length < 2 ? 'Full name is required' : '';
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
      case 'phone':
        if (!value) return 'Phone number is required';
        const cleanPhone = value.replace(/\s/g, '');
        if (!/^\d{10}$/.test(cleanPhone)) {
          return 'Enter a valid 10-digit phone number';
        }
        return '';
      case 'location':
        return value.trim().length < 3 ? 'Please enter your delivery address' : '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: keyof CheckoutFormData, value: string) => {
    onUpdateForm(field, value);
    const error = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    errors.name = validateField('name', form.name);
    errors.email = validateField('email', form.email);
    errors.phone = validateField('phone', form.phone);
    errors.location = validateField('location', form.location);
    setFormErrors(errors);
    return !Object.values(errors).some(e => e);
  };

  const handleNext = () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      const firstError = Object.keys(formErrors).find(key => formErrors[key]);
      if (firstError) {
        const element = document.querySelector(`input[name="${firstError}"]`);
        if (element) (element as HTMLInputElement).focus();
      }
      return;
    }

    if (!preferredCourier.trim()) {
      toast.error('Please enter your preferred courier');
      return;
    }

    if (!selectedPaymentProvider) {
      toast.error('Please select a payment method');
      return;
    }

    onNext();
  };

  const inputClasses = (fieldName: string) => `
    w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-base
    ${focusedField === fieldName 
      ? 'border-[var(--primary)] shadow-md ring-2 ring-[var(--primary)]/20' 
      : formErrors[fieldName] 
        ? 'border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800' 
        : 'border-[var(--border)] hover:border-[var(--border)]'
    }
    focus:outline-none bg-[var(--background)] text-[var(--foreground)]
  `;

  // Combine all providers with proper fallback
  const allProviders = [
    ...(paymentProviders?.automatic || []),
    ...(paymentProviders?.manual || [])
  ];

  const isLoadingProviders = paymentProviders === null;

  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <User size={18} className="text-[var(--primary)]" />
            Customer Information
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">Fill in your details to proceed</p>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  className={`${inputClasses('name')} pl-10`}
                  placeholder="Your full name"
                />
              </div>
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  onChange={e => handleFieldChange('phone', e.target.value)}
                  className={`${inputClasses('phone')} pl-10`}
                  placeholder="099 123 4567"
                />
              </div>
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="email"
                name="email"
                value={form.email}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                onChange={e => handleFieldChange('email', e.target.value)}
                className={`${inputClasses('email')} pl-10`}
                placeholder="yourmail@example.com"
              />
            </div>
            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Delivery Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="text"
                name="location"
                value={form.location}
                onFocus={() => setFocusedField('location')}
                onBlur={() => setFocusedField(null)}
                onChange={e => handleFieldChange('location', e.target.value)}
                className={`${inputClasses('location')} pl-10`}
                placeholder="Lilongwe, Area 10, House 123"
              />
            </div>
            {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5 flex items-center gap-1">
              <MessageSquare size={16} /> Delivery Notes
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => onUpdateForm('notes', e.target.value)}
              className="w-full px-4 py-3 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition resize-none"
              placeholder="Gate code, landmark, special instructions..."
            />
          </div>
        </div>
      </div>

      {/* Delivery Method - Simple Text Input */}
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Truck size={18} className="text-[var(--primary)]" />
            Delivery Method
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">Enter your preferred courier</p>
        </div>
        <div className="p-4 sm:p-6">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Preferred Courier <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Truck size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="text"
                value={preferredCourier}
                onChange={(e) => onPreferredCourierChange(e.target.value)}
                className="w-full px-4 py-3 pl-10 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
                placeholder="e.g., CTS Courier, Speed Courier, DHL, etc."
              />
            </div>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Enter the courier you prefer for delivery
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method - Always Visible */}
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <CreditCard size={18} className="text-[var(--primary)]" />
            Payment Method
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">Select how you want to pay</p>
        </div>
        <div className="p-4 sm:p-6">
          {isLoadingProviders ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
              <span className="ml-2 text-[var(--foreground-muted)]">Loading payment methods...</span>
            </div>
          ) : allProviders.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[var(--foreground-muted)]">No payment methods available</p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">Please contact support</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {allProviders.map(provider => (
                <label
                  key={provider.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedPaymentProvider?.id === provider.id
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedPaymentProvider?.id === provider.id}
                      onChange={() => onSelectPaymentProvider(provider)}
                      className="w-5 h-5 text-[var(--primary)] shrink-0"
                    />
                    <div>
                      <p className="font-medium text-[var(--foreground)] text-sm sm:text-base">{provider.name}</p>
                      <p className="text-xs text-[var(--foreground-muted)] capitalize">{provider.category?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-9 sm:ml-0 ${
                    provider.type === 'automatic' 
                      ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                      : 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                  }`}>
                    {provider.type === 'automatic' ? 'Instant' : 'Manual'}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPrev}
          className="flex-1 px-6 py-3 border-2 border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition"
        >
          Back to Cart
        </button>
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="flex-[2] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20"
        >
          Review Order
        </button>
      </div>
    </div>
  );
}
