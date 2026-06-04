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
  ArrowDown
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

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Stat Card Component
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
    <div className={`rounded-xl border p-5 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-5 h-5 ${iconColorClasses[color]}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{title}</p>
    </div>
  );
}

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  
  if (!token || !verifyToken(token)) {
    redirect('/admin/login');
  }

  // Fetch data from the realtime endpoint
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

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/analytics/realtime`, {
      cache: 'no-store',
      headers: { Cookie: cookieStore.toString() }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch analytics: ${res.status}`);
    }
    
    const fetchedData = await res.json();
    data = {
      stats: fetchedData.stats || data.stats,
      monthlyData: fetchedData.monthlyData || [],
      topProducts: fetchedData.topProducts || [],
      customerStats: fetchedData.customerStats || data.customerStats,
    };
  } catch (err) {
    console.error('Analytics fetch error:', err);
    error = true;
  }

  const stats = data.stats;
  const monthlyData = data.monthlyData;
  const topProducts = data.topProducts;
  const customerStats = data.customerStats;

  // Calculate trends (mock - replace with actual trend data from API if available)
  const revenueTrend = stats.totalRevenue > 0 ? '+12%' : '0%';
  const ordersTrend = stats.totalOrders > 0 ? '+8%' : '0%';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Overview of your business performance
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          /* Error State */
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              Failed to Load Analytics
            </h3>
            <p className="text-red-600 dark:text-red-300">
              There was an error loading your analytics data. Please try again later.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              {/* Customer Retention - Left Column */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <Users className="w-5 h-5 text-orange-500" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">Customer Retention</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Repeat Customers</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {customerStats.repeatCustomers}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">New Customers</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                          {customerStats.newCustomers}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>

                    {customerStats.repeatCustomers + customerStats.newCustomers > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Retention Rate: {' '}
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {Math.round((customerStats.repeatCustomers / (customerStats.repeatCustomers + customerStats.newCustomers)) * 100)}%
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Sales Chart - Right Column */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                      <h2 className="font-semibold text-gray-900 dark:text-white">Monthly Sales Trend</h2>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <ArrowUp className="w-3 h-3 text-green-500" />
                        Revenue
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowDown className="w-3 h-3 text-blue-500" />
                        Orders
                      </span>
                    </div>
                  </div>
                  
                  {monthlyData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600">
                      <div className="text-center">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No sales data available</p>
                      </div>
                    </div>
                  ) : (
                    <MonthlySalesChart data={monthlyData} />
                  )}
                </div>
              </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Top Selling Products</h2>
                </div>
              </div>
              
              {topProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No product sales data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Units Sold
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {topProducts.map((product: TopProduct, index: number) => (
                        <tr key={product.product_name} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          <td className="px-6 py-4">
                            <span className={`
                              inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                              ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400' :
                                index === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                                index === 2 ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400' :
                                'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500'}
                            `}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.product_name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {product.sold} units
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
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

            {/* Summary Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Data updates in real-time. Last sync: {new Date().toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
