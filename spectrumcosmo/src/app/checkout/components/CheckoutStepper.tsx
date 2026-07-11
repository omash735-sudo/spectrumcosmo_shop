// app/checkout/components/CheckoutStepper.tsx
'use client';

import { CheckCircle } from 'lucide-react';
import clsx from 'clsx';

const steps = [
  { number: 1, label: 'Cart' },
  { number: 2, label: 'Details' },
  { number: 3, label: 'Review' },
  { number: 4, label: 'Payment' },
];

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

export default function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.number;
        const isCompleted = currentStep > step.number;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all text-sm sm:text-base font-semibold',
                  isActive
                    ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
                )}
              >
                {isCompleted ? <CheckCircle size={16} className="sm:w-5 sm:h-5" /> : step.number}
              </div>
              <span
                className={clsx(
                  'text-xs sm:text-sm font-medium hidden sm:inline',
                  isActive
                    ? 'text-[var(--foreground)]'
                    : isCompleted
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-[var(--foreground-muted)]'
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={clsx(
                  'w-6 sm:w-10 h-0.5 mx-1 sm:mx-2',
                  isCompleted ? 'bg-green-500' : 'bg-[var(--border)]'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
