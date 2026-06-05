// components/admin/PaymentMethodForm.tsx
'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

interface CreateMethodState {
  error?: string;
  success?: string;
}

interface PaymentMethodFormProps {
  createMethodAction: (prevState: CreateMethodState | null, formData: FormData) => Promise<CreateMethodState>;
}

export function PaymentMethodForm({ createMethodAction }: PaymentMethodFormProps) {
  const [state, setState] = useState<CreateMethodState | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    const result = await createMethodAction(null, formData);
    setState(result);
    setIsPending(false);
    if (result.success) {
      const form = document.getElementById('create-method-form') as HTMLFormElement;
      if (form) form.reset();
      setTimeout(() => setState(null), 3000);
    }
  }

  return (
    <form id="create-method-form" action={handleSubmit} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-600 dark:text-green-400">
          {state.success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Method Name *
          </label>
          <input
            name="name"
            type="text"
            placeholder="e.g., Airtel Money, National Bank"
            className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payment Type *
          </label>
          <select
            name="type"
            className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          >
            <option value="">Select type</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="bank">Bank Transfer</option>
            <option value="cash">Cash on Delivery</option>
            <option value="card">Credit/Debit Card</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Logo URL
          </label>
          <input
            name="logo_url"
            type="url"
            placeholder="https://example.com/logo.png"
            className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Account Number
          </label>
          <input
            name="account_number"
            type="text"
            placeholder="Account number or wallet ID"
            className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Branch (Optional)
          </label>
          <input
            name="branch"
            type="text"
            placeholder="Bank branch name"
            className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Instructions
          </label>
          <textarea
            name="instructions"
            placeholder="Payment instructions for customers..."
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white rounded-lg text-sm font-medium transition shadow-sm"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plus size={16} />
            Add Payment Method
          </>
        )}
      </button>
    </form>
  );
}
