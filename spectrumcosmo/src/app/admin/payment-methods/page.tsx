// app/admin/payment-methods/page.tsx
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { PaymentMethod } from '@/types/payment';
import { Plus, Eye, EyeOff, Trash2, Edit, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Payment Methods | Admin Dashboard | SpectrumCosmo',
  description: 'Manage available payment options for customers.',
  robots: 'noindex, nofollow',
};

// Types
interface CreateMethodState {
  error?: string;
  success?: string;
}

// Server action types
type ActionResponse = {
  error?: string;
  success?: string;
};

async function createMethod(prevState: CreateMethodState | null, formData: FormData): Promise<CreateMethodState> {
  const sql = getDb();

  const name = formData.get('name')?.toString().trim();
  const type = formData.get('type')?.toString();
  const logo_url = formData.get('logo_url')?.toString().trim() || null;
  const account_number = formData.get('account_number')?.toString().trim() || null;
  const branch = formData.get('branch')?.toString().trim() || null;
  const instructions = formData.get('instructions')?.toString().trim() || null;

  // Validation
  if (!name) {
    return { error: 'Method name is required' };
  }
  if (!type) {
    return { error: 'Payment type is required' };
  }

  const validTypes = ['mobile_money', 'bank', 'cash', 'card'];
  if (!validTypes.includes(type)) {
    return { error: 'Invalid payment type' };
  }

  try {
    await sql`
      INSERT INTO payment_methods (
        name,
        type,
        logo_url,
        account_number,
        branch,
        instructions,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        ${name},
        ${type},
        ${logo_url},
        ${account_number},
        ${branch},
        ${instructions},
        true,
        NOW(),
        NOW()
      )
    `;

    revalidatePath('/admin/payment-methods');
    return { success: 'Payment method added successfully' };
  } catch (err) {
    console.error('Failed to create payment method:', err);
    return { error: 'Failed to create payment method' };
  }
}

async function toggleMethod(id: string): Promise<ActionResponse> {
  'use server';

  const sql = getDb();

  try {
    const [method] = await sql`
      SELECT is_active FROM payment_methods WHERE id = ${id}
    `;

    if (!method) {
      return { error: 'Payment method not found' };
    }

    await sql`
      UPDATE payment_methods
      SET is_active = ${!method.is_active}, updated_at = NOW()
      WHERE id = ${id}
    `;

    revalidatePath('/admin/payment-methods');
    return { success: `Method ${method.is_active ? 'disabled' : 'enabled'} successfully` };
  } catch (err) {
    console.error('Failed to toggle payment method:', err);
    return { error: 'Failed to update payment method' };
  }
}

async function deleteMethod(id: string): Promise<ActionResponse> {
  'use server';

  const sql = getDb();

  try {
    await sql`
      DELETE FROM payment_methods WHERE id = ${id}
    `;

    revalidatePath('/admin/payment-methods');
    return { success: 'Payment method deleted successfully' };
  } catch (err) {
    console.error('Failed to delete payment method:', err);
    return { error: 'Failed to delete payment method' };
  }
}

export default async function PaymentMethodsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || !verifyToken(token)) {
    redirect('/admin/login');
  }

  const sql = getDb();
  let methods: PaymentMethod[] = [];
  let error: string | null = null;

  try {
    const result = await sql`
      SELECT *
      FROM payment_methods
      ORDER BY created_at DESC
    `;
    methods = result as PaymentMethod[];
  } catch (err) {
    console.error('Failed to fetch payment methods:', err);
    error = 'Unable to load payment methods';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage available payment options for customers.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Failed to Load Methods</h3>
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Create Form Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Plus size={18} className="text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Payment Method</h2>
                </div>
              </div>
              <div className="p-6">
                <CreatePaymentMethodForm />
              </div>
            </div>

            {/* Methods List Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Available Methods</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {methods.length} payment method{methods.length !== 1 ? 's' : ''} configured
                </p>
              </div>

              {methods.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No payment methods</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add your first payment method using the form above.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th className="text-left px-6 py-3 font-medium">Name</th>
                        <th className="text-left px-6 py-3 font-medium">Type</th>
                        <th className="text-left px-6 py-3 font-medium">Account</th>
                        <th className="text-left px-6 py-3 font-medium">Status</th>
                        <th className="text-right px-6 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {methods.map((method) => (
                        <tr key={method.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {method.logo_url && (
                                <img src={method.logo_url} alt={method.name} className="w-6 h-6 object-contain" />
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {method.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                              {method.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {method.account_number || '—'}
                            </p>
                            {method.branch && (
                              <p className="text-xs text-gray-400">Branch: {method.branch}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              method.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                              {method.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <form action={async () => {
                                'use server';
                                await toggleMethod(method.id);
                              }}>
                                <button
                                  type="submit"
                                  className="p-1.5 text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 transition rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                  title={method.is_active ? 'Disable' : 'Enable'}
                                >
                                  {method.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </form>
                              <form action={async () => {
                                'use server';
                                await deleteMethod(method.id);
                              }}>
                                <button
                                  type="submit"
                                  className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Client component for form with state
function CreatePaymentMethodForm() {
  const [state, setState] = useState<CreateMethodState | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    const result = await createMethod(null, formData);
    setState(result);
    setIsPending(false);
    if (result.success) {
      // Reset form on success
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

// Add missing import
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
