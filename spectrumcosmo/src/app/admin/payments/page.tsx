// app/admin/payments/page.tsx
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { verifyToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { 
  PaymentRecord, 
  PaymentStatus, 
  PAYMENT_STATUS_CONFIG,
  formatPaymentAmount,
  formatPaymentDate,
  calculatePaymentStats
} from '@/types/payment';
import { 
  AlertCircle, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  ArrowUpRight,
  Calendar,
  Search,
  Filter,
  Download
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Payments | Admin Dashboard | SpectrumCosmo',
  description: 'View and manage customer payment records.',
  robots: 'noindex, nofollow',
};

// Helper to get icon component dynamically
function getStatusIcon(iconName: string) {
  const icons: Record<string, any> = {
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    AlertCircle,
  };
  return icons[iconName] || Clock;
}

// Helper to format relative time
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return formatPaymentDate(date);
}

export default async function PaymentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || !verifyToken(token)) {
    redirect('/admin/login');
  }

  const sql = getDb();
  let payments: PaymentRecord[] = [];
  let error: string | null = null;

  try {
    const result = await sql`
      SELECT 
        id,
        order_id,
        customer_name,
        phone_number,
        customer_email,
        payment_method,
        payment_method_type,
        total_amount,
        status,
        transaction_id,
        onekhusa_transaction_id,
        reference_number,
        payment_proof_url,
        notes,
        processed_by,
        processed_at,
        created_at,
        updated_at
      FROM orders
      WHERE payment_method IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 100
    `;
    payments = result as PaymentRecord[];
  } catch (err) {
    console.error('Failed to fetch payments:', err);
    error = 'Unable to load payment records. Please try again later.';
  }

  const stats = calculatePaymentStats(payments);
  const successRateColor = stats.successRate >= 70 ? 'text-emerald-600' : stats.successRate >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Payment records are automatically updated by the payment gateway.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <Filter size={14} />
                Filter
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <Download size={14} />
                Export
              </button>
              <div className="px-3 py-1.5 bg-green-100 dark:bg-green-950/30 rounded-lg">
                <span className="text-green-700 dark:text-green-400 font-medium text-sm">
                  Total: {formatPaymentAmount(stats.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCount}</p>
                <p className="text-xs text-gray-400 mt-1">{formatPaymentAmount(stats.totalAmount)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center">
                <CreditCard size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingCount}</p>
                <p className="text-xs text-gray-400 mt-1">{formatPaymentAmount(stats.pendingAmount)}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-950/30 rounded-full flex items-center justify-center">
                <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approvedCount}</p>
                <p className="text-xs text-gray-400 mt-1">{formatPaymentAmount(stats.approvedAmount)}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
                <p className={`text-2xl font-bold ${successRateColor}`}>{stats.successRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-400 mt-1">Avg. Order: {formatPaymentAmount(stats.averageOrderValue)}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, email, or transaction ID..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Records</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {payments.length} transaction{payments.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar size={12} />
              <span>Last 30 days</span>
            </div>
          </div>

          {error ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
                Failed to Load Payments
              </h3>
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                No payment records
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No payment transactions have been recorded yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="text-left px-6 py-3 font-medium">Customer</th>
                    <th className="text-left px-6 py-3 font-medium">Method</th>
                    <th className="text-left px-6 py-3 font-medium">Amount</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-left px-6 py-3 font-medium">Transaction ID</th>
                    <th className="text-left px-6 py-3 font-medium">Date</th>
                    <th className="text-right px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {payments.map((payment) => {
                    const statusConfig = PAYMENT_STATUS_CONFIG[payment.status as PaymentStatus] || PAYMENT_STATUS_CONFIG.pending;
                    const StatusIcon = getStatusIcon(statusConfig?.icon || 'Clock');
                    
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition group">
                        <td className="px-6 py-4">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {payment.customer_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {payment.phone_number || payment.customer_email}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <CreditCard size={12} />
                            {payment.payment_method}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatPaymentAmount(payment.total_amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                            {payment.onekhusa_transaction_id || payment.transaction_id || '—'}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatPaymentDate(payment.created_at)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(payment.created_at)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/orders/${payment.order_id}`}
                            className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 transition opacity-0 group-hover:opacity-100"
                          >
                            View Order
                            <ArrowUpRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with pagination placeholder */}
        {payments.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {payments.length} of {stats.totalCount} transactions
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
