// app/admin/payment-methods/page.tsx
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { PaymentMethod } from '@/types/payment';
import { Plus, Eye, EyeOff, Trash2, AlertCircle, CreditCard, Wallet, Building2, Coins } from 'lucide-react';
import { PaymentMethodForm } from '@/components/admin/PaymentMethodForm';

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
async function createMethod(prevState: CreateMethodState | null, formData: FormData): Promise<CreateMethodState> {
  'use server';

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

async function toggleMethod(id: string): Promise<void> {
  'use server';

  const sql = getDb();

  const [method] = await sql`
    SELECT is_active FROM payment_methods WHERE id = ${id}
  `;

  if (method) {
    await sql`
      UPDATE payment_methods
      SET is_active = ${!method.is_active}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }

  revalidatePath('/admin/payment-methods');
}

async function deleteMethod(id: string): Promise<void> {
  'use server';

  const sql = getDb();

  await sql`
    DELETE FROM payment_methods WHERE id = ${id}
  `;

  revalidatePath('/admin/payment-methods');
}

// ===== SKELETON =====
function PaymentMethodsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
      </div>
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-6">
        <div className="h-6 bg-[var(--background-secondary)] rounded w-32 mb-4" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-[var(--background-secondary)] rounded" />
          ))}
        </div>
      </div>
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-6">
        <div className="h-6 bg-[var(--background-secondary)] rounded w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-[var(--background-secondary)] rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

const typeIcons: Record<string, any> = {
  mobile_money: Wallet,
  bank: Building2,
  cash: Coins,
  card: CreditCard,
};

const typeLabels: Record<string, string> = {
  mobile_money: 'Mobile Money',
  bank: 'Bank Transfer',
  cash: 'Cash',
  card: 'Card Payment',
};

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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Payment Methods</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
              Manage available payment options for customers.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        {error ? (
          /* Error State */
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6 sm:p-8 text-center">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-base sm:text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Failed to Load Methods</h3>
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Create Form Card */}
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Plus size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--primary)]" />
                  <h2 className="text-sm sm:text-lg font-semibold text-[var(--foreground)]">Add Payment Method</h2>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <PaymentMethodForm createMethodAction={createMethod} />
              </div>
            </div>

            {/* Methods List Card */}
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)]">
                <h2 className="text-sm sm:text-lg font-semibold text-[var(--foreground)]">Available Methods</h2>
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                  {methods.length} payment method{methods.length !== 1 ? 's' : ''} configured
                </p>
              </div>

              {methods.length === 0 ? (
                <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-[var(--background-secondary)] rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6 text-[var(--foreground-muted)] opacity-40" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-1">No payment methods</h3>
                  <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                    Add your first payment method using the form above.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-[var(--background-secondary)]">
                      <tr className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase tracking-wider">
                        <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium">Name</th>
                        <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium">Type</th>
                        <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium hidden sm:table-cell">Account</th>
                        <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium">Status</th>
                        <th className="text-right px-4 sm:px-6 py-2 sm:py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {methods.map((method) => {
                        const TypeIcon = typeIcons[method.type] || CreditCard;
                        return (
                          <tr key={method.id} className="hover:bg-[var(--background-secondary)] transition">
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                {method.logo_url ? (
                                  <img 
                                    src={method.logo_url} 
                                    alt={method.name} 
                                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" 
                                  />
                                ) : (
                                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                                    <TypeIcon size={12} className="sm:w-3.5 sm:h-3.5 text-[var(--primary)]" />
                                  </div>
                                )}
                                <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] truncate">
                                  {method.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
                                {typeLabels[method.type] || method.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] font-mono">
                                {method.account_number || '—'}
                              </p>
                              {method.branch && (
                                <p className="text-[10px] text-[var(--foreground-muted)] opacity-70">Branch: {method.branch}</p>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                                method.is_active
                                  ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                              }`}>
                                {method.is_active ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                              <div className="flex items-center justify-end gap-1 sm:gap-2">
                                <form action={toggleMethod.bind(null, method.id)}>
                                  <button
                                    type="submit"
                                    className="p-1.5 sm:p-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 min-h-[32px] min-w-[32px] flex items-center justify-center"
                                    title={method.is_active ? 'Disable' : 'Enable'}
                                  >
                                    {method.is_active ? <EyeOff size={14} className="sm:w-4 sm:h-4" /> : <Eye size={14} className="sm:w-4 sm:h-4" />}
                                  </button>
                                </form>
                                <form action={deleteMethod.bind(null, method.id)}>
                                  <button
                                    type="submit"
                                    className="p-1.5 sm:p-2 text-[var(--foreground-muted)] hover:text-red-600 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 min-h-[32px] min-w-[32px] flex items-center justify-center"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                  </button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
