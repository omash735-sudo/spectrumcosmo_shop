// app/checkout/components/Step2CustomerInfo.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, MessageSquare, Truck, Loader2, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { CheckoutFormData, ServiceabilityResponse, DeliveryMethod } from '@/lib/types/order';

interface Step2CustomerInfoProps {
  form: CheckoutFormData;
  onUpdateForm: (field: keyof CheckoutFormData, value: string) => void;
  deliveryMethods: DeliveryMethod[];
  selectedDeliveryMethodId: number | null;
  onSelectDeliveryMethod: (id: number) => void;
  serviceability: ServiceabilityResponse | null;
  isCheckingServiceability: boolean;
  requiresQuote: boolean;
  quoteRequested: boolean;
  isSubmitting: boolean;
  onCheckServiceability: (location: string, methodId: number) => void;
  onRequestQuote: () => void;
  onNext: () => void;
  onPrev: () => void;
  error: string | null;
}

export default function Step2CustomerInfo({
  form,
  onUpdateForm,
  deliveryMethods,
  selectedDeliveryMethodId,
  onSelectDeliveryMethod,
  serviceability,
  isCheckingServiceability,
  requiresQuote,
  quoteRequested,
  isSubmitting,
  onCheckServiceability,
  onRequestQuote,
  onNext,
  onPrev,
  error,
}: Step2CustomerInfoProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [locationTimeout, setLocationTimeout] = useState<NodeJS.Timeout | null>(null);

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

    if (field === 'location' && value.length >= 3 && selectedDeliveryMethodId) {
      if (locationTimeout) clearTimeout(locationTimeout);
      const timeout = setTimeout(() => {
        onCheckServiceability(value, selectedDeliveryMethodId);
      }, 600);
      setLocationTimeout(timeout);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    errors.name = validateField('name', form.name);
    errors.email = validateField('email', form.email);
    errors.phone = validateField('phone', form.phone);
    errors.location = validateField('location', form.location);
    setFormErrors(errors);
    const hasErrors = Object.values(errors).some(e => e);
    if (hasErrors) {
      console.log('Validation errors:', errors);
    }
    return !hasErrors;
  };

  const handleNext = () => {
    const isValid = validateForm();

    if (!isValid) {
      toast.error('Please fill in all required fields correctly');
      const firstError = Object.keys(formErrors).find(key => formErrors[key]);
      if (firstError) {
        const element = document.querySelector(`input[name="${firstError}"]`);
        if (element) (element as HTMLInputElement).focus();
      }
      return;
    }

    if (!selectedDeliveryMethodId) {
      toast.error('Please select a delivery method');
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

  const deliveryFee = serviceability?.isServiceable && serviceability.baseFee && selectedDeliveryMethodId
    ? serviceability.baseFee * (deliveryMethods.find(m => m.id === selectedDeliveryMethodId)?.type === 'express' 
        ? (serviceability.area?.express_multiplier || 1.5) 
        : 1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <User size={18} className="text-[var(--primary)]" />
            Customer Information
          </h2>
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
            {isCheckingServiceability && (
              <div className="mt-2 flex items-center gap-2 text-[var(--foreground-muted)]">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Checking delivery availability...</span>
              </div>
            )}
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

      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Truck size={18} className="text-[var(--primary)]" />
            Delivery Method
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid gap-3">
            {deliveryMethods.map(method => (
              <label
                key={method.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedDeliveryMethodId === method.id
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/30'
                }`}
              >
                <div className="flex items-center gap-4 mb-2 sm:mb-0">
                  <input
                    type="radio"
                    name="delivery_method"
                    checked={selectedDeliveryMethodId === method.id}
                    onChange={() => {
                      onSelectDeliveryMethod(method.id);
                      if (form.location.length >= 3) {
                        onCheckServiceability(form.location, method.id);
                      }
                    }}
                    className="w-5 h-5 text-[var(--primary)] shrink-0"
                  />
                  <div>
                    <p className="font-medium text-[var(--foreground)] text-sm sm:text-base">{method.name}</p>
                    {serviceability?.estimatedDays && (
                      <p className="text-xs text-[var(--foreground-muted)]">Estimated {serviceability.estimatedDays}</p>
                    )}
                  </div>
                </div>
                <p className="font-semibold text-[var(--foreground)] ml-9 sm:ml-0">
                  {serviceability?.isServiceable && deliveryFee > 0
                    ? `${deliveryFee.toLocaleString()} MWK`
                    : serviceability?.isServiceable
                    ? 'Calculated'
                    : 'Quote pending'}
                </p>
              </label>
            ))}
          </div>

          {serviceability && !serviceability.isServiceable && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Out of Service Area</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">{serviceability.message}</p>
                  {!quoteRequested && (
                    <button
                      onClick={onRequestQuote}
                      disabled={isSubmitting}
                      className="mt-3 flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Request Delivery Quote
                    </button>
                  )}
                  {quoteRequested && (
                    <div className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-500">
                      <CheckCircle size={16} />
                      <span className="text-sm">Quote request submitted. Check your email.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {serviceability?.isServiceable && serviceability.baseFee && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
              <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle size={16} />
                Delivery available to your area
                {serviceability.estimatedDays && ` • Est. ${serviceability.estimatedDays}`}
              </p>
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
          disabled={isSubmitting || !selectedDeliveryMethodId}
          className="flex-[2] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20"
        >
          Review Order
        </button>
      </div>
    </div>
  );
}
