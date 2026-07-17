export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { MonthlySalesChart } from '@/components/admin/Charts';
import { 
  ShoppingBag, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Users,
  Package,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from 'lucide-react';

// Types
interface Stats {
  totalOrders: number;
  totalRevenue: number;
  confirmedOrders: number;
  pendingOrders: number;
  declinedOrders: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  product_name: string;
  sold: number;
  revenue?: number;
  image?: string;
}

interface CustomerStats {
  repeatCustomers: number;
  newCustomers: number;
}

interface AnalyticsData {
  stats: Stats;
  monthlyData: MonthlyData[];
  topProducts: TopProduct[];
  customerStats: CustomerStats;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColorClasses[color]}`} />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5 sm:mt-1">{title}</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
      <div className="h-4 bg-[var(--background-secondary)] rounded w-64" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[var(--background-secondary)] rounded-xl h-24" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[var(--background-secondary)] rounded-xl h-64" />
        <div className="lg:col-span-2 bg-[var(--background-secondary)] rounded-xl h-64" />
      </div>
      <div className="bg-[var(--background-secondary)] rounded-xl h-64" />
    </div>
  );
}

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  
  if (!token || !verifyToken(token)) {
    redirect('/admin/login');
  }

  let data: AnalyticsData = {
    stats: {
      totalOrders: 0,
      totalRevenue: 0,
      confirmedOrders: 0,
      pendingOrders: 0,
      declinedOrders: 0,
    },
    monthlyData: [],
    topProducts: [],
    customerStats: {
      repeatCustomers: 0,
      newCustomers: 0,
    },
  };

  let error = false;
  let errorMessage = '';

  try {
    const res = await fetch('https://spectrumcosmo.vercel.app/api/admin/analytics/realtime', {
      cache: 'no-store',
      headers: {
        Cookie: cookieStore.toString(),
      },
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const fetchedData = await res.json();
    
    data = {
      stats: fetchedData.stats || data.stats,
      monthlyData: Array.isArray(fetchedData.monthlyData) ? fetchedData.monthlyData : [],
      topProducts: Array.isArray(fetchedData.topProducts) ? fetchedData.topProducts : [],
      customerStats: fetchedData.customerStats || data.customerStats,
    };
  } catch (err) {
    console.error('Analytics fetch error:', err);
    error = true;
    errorMessage = err instanceof Error ? err.message : 'Unknown error';
  }

  const stats = data.stats;
  const monthlyData = data.monthlyData;
  const topProducts = data.topProducts;
  const customerStats = data.customerStats;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Analytics</h1>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
              Overview of your business performance
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {error ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6 sm:p-8 text-center">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              Failed to Load Analytics
            </h3>
            <p className="text-sm sm:text-base text-red-600 dark:text-red-300">
              Error: {errorMessage || 'Please try again later.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <StatCard
                title="Total Orders"
                value={stats.totalOrders}
                icon={ShoppingBag}
                color="blue"
              />
              <StatCard
                title="Revenue"
                value={formatCurrency(stats.totalRevenue)}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Confirmed"
                value={stats.confirmedOrders}
                icon={CheckCircle}
                color="green"
              />
              <StatCard
                title="Pending"
                value={stats.pendingOrders}
                icon={Clock}
                color="yellow"
              />
              <StatCard
                title="Declined"
                value={stats.declinedOrders}
                icon={XCircle}
                color="red"
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="lg:col-span-1">
                <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-[var(--border)]">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                    <h2 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">Customer Retention</h2>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">Repeat Customers</p>
                        <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                          {customerStats.repeatCustomers}
                        </p>
                      </div>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">New Customers</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
                          {customerStats.newCustomers}
                        </p>
                      </div>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>

                    {customerStats.repeatCustomers + customerStats.newCustomers > 0 && (
                      <div className="mt-3 sm:mt-4 pt-3 border-t border-[var(--border)]">
                        <p className="text-xs text-[var(--foreground-muted)]">
                          Retention Rate: {' '}
                          <span className="font-medium text-[var(--foreground)]">
                            {Math.round((customerStats.repeatCustomers / (customerStats.repeatCustomers + customerStats.newCustomers)) * 100)}%
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                      <h2 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">Monthly Sales Trend</h2>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-1">
                        <ArrowUp className="w-3 h-3 text-emerald-500" />
                        Revenue
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowDown className="w-3 h-3 text-blue-500" />
                        Orders
                      </span>
                    </div>
                  </div>
                  
                  {monthlyData.length === 0 ? (
                    <div className="h-48 sm:h-64 flex items-center justify-center text-[var(--foreground-muted)]">
                      <div className="text-center">
                        <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-xs sm:text-sm">No sales data available</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 sm:h-64">
                      <MonthlySalesChart data={monthlyData} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                  <h2 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">Top Selling Products</h2>
                </div>
              </div>
              
              {topProducts.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <Package className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--foreground-muted)] opacity-30 mx-auto mb-3" />
                  <p className="text-sm text-[var(--foreground-muted)]">No product sales data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead className="bg-[var(--background-secondary)]">
                      <tr>
                        <th className="text-left px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="text-left px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                          Product
                        </th>
                        <th className="text-left px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                          Units Sold
                        </th>
                        <th className="text-left px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {topProducts.map((product: TopProduct, index: number) => (
                        <tr key={product.product_name} className="hover:bg-[var(--background-secondary)] transition">
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className={`
                              inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                              ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400' :
                                index === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                                index === 2 ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400' :
                                'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'}
                            `}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-3">
                              {product.image && (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-[var(--background-secondary)] border border-[var(--border)] flex-shrink-0">
                                  <img 
                                    src={product.image} 
                                    alt={product.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] truncate max-w-[120px] sm:max-w-[200px]">
                                {product.product_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                              {product.sold} units
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                              {formatCurrency(product.revenue || product.sold * 10000)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                Data updates in real-time. Last sync: {new Date().toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
