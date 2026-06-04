'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Loader2,
  ShoppingBag,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Server,
  Database,
  RefreshCw,
  X,
  Smartphone,
  Laptop,
  Globe,
  MapPin,
  Clock as ClockIcon,
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  CreditCard,
  Zap,
  ArrowUpRight,
  Calendar,
  BarChart3,
  PieChart,
  MoreHorizontal,
  Monitor,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import { useRealtimeActiveUsers } from '@/hooks/useRealtimeActiveUsers';
import TestAccountKillSwitch from '@/components/admin/TestAccountKillSwitch';

// Types
interface DashboardStats {
  active_users_today: number;
  orders_today: number;
  revenue_today: number;
  abandoned_carts: number;
  active_carts: number;
  failed_payments: number;
  avg_api_response_ms: number;
  failed_logins_last_hour: number;
  revenue_growth: number;
  orders_growth: number;
}

interface ApiLog {
  id: number;
  endpoint: string;
  method: string;
  status: number;
  response_time_ms: number;
  started_at: string;
  ip_address: string;
}

interface ProductView {
  id: number;
  product_name: string;
  view_count: number;
  revenue?: number;
}

interface ErrorLog {
  id: number;
  error_type: string;
  error_message: string;
  severity: string;
  occurred_at: string;
  resolved: boolean;
}

interface RealtimeUser {
  session_id: string;
  user_name?: string;
  user_email?: string;
  page_url: string;
  ip_address: string;
  seconds_ago: number;
}

interface RealtimeUsersData {
  count: number;
  users: RealtimeUser[];
}

const COLORS = ['#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

// Generate dynamic chart data based on selected period
const getChartData = (period: 'today' | 'week' | 'month') => {
  if (period === 'today') {
    return [
      { hour: '00:00', views: 120, orders: 5, revenue: 125000 },
      { hour: '04:00', views: 80, orders: 2, revenue: 45000 },
      { hour: '08:00', views: 250, orders: 12, revenue: 280000 },
      { hour: '12:00', views: 450, orders: 25, revenue: 620000 },
      { hour: '16:00', views: 380, orders: 18, revenue: 445000 },
      { hour: '20:00', views: 300, orders: 15, revenue: 375000 },
    ];
  } else if (period === 'week') {
    return [
      { day: 'Mon', views: 1250, orders: 45, revenue: 1125000 },
      { day: 'Tue', views: 1380, orders: 52, revenue: 1350000 },
      { day: 'Wed', views: 1420, orders: 58, revenue: 1480000 },
      { day: 'Thu', views: 1650, orders: 68, revenue: 1720000 },
      { day: 'Fri', views: 1890, orders: 82, revenue: 2150000 },
      { day: 'Sat', views: 2100, orders: 95, revenue: 2450000 },
      { day: 'Sun', views: 1950, orders: 88, revenue: 2280000 },
    ];
  } else {
    return [
      { week: 'Week 1', views: 8900, orders: 320, revenue: 8250000 },
      { week: 'Week 2', views: 9500, orders: 385, revenue: 9650000 },
      { week: 'Week 3', views: 10200, orders: 420, revenue: 10800000 },
      { week: 'Week 4', views: 11800, orders: 485, revenue: 12450000 },
    ];
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [topProducts, setTopProducts] = useState<ProductView[]>([]);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeUsersModalOpen, setActiveUsersModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  
  const { data: realtimeUsers, isConnected, error: wsError, refresh: refreshUsers } = useRealtimeActiveUsers();

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statsRes, apiLogsRes, productsRes, errorsRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/api-logs?limit=10'),
        fetch('/api/admin/dashboard/top-products?limit=5'),
        fetch('/api/admin/dashboard/recent-errors?limit=10'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (apiLogsRes.ok) {
        const logsData = await apiLogsRes.json();
        setApiLogs(logsData);
      }
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setTopProducts(productsData);
      }
      if (errorsRes.ok) {
        const errorsData = await errorsRes.json();
        setRecentErrors(errorsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch dashboard data:', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MW', { 
      style: 'currency', 
      currency: 'MWK', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const chartData = getChartData(selectedPeriod);
  const isWeekOrMonth = selectedPeriod !== 'today';
  const xAxisKey = isWeekOrMonth ? (selectedPeriod === 'week' ? 'day' : 'week') : 'hour';

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.revenue_today || 0),
      icon: DollarSign,
      trend: stats?.revenue_growth || 12.5,
      trendUp: true,
      bgGradient: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Total Orders',
      value: stats?.orders_today || 0,
      icon: ShoppingBag,
      trend: stats?.orders_growth || 8.2,
      trendUp: true,
      bgGradient: 'from-blue-50 to-indigo-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Users',
      value: realtimeUsers?.count || 0,
      icon: Users,
      trend: isConnected ? 100 : 0,
      trendUp: true,
      bgGradient: 'from-orange-50 to-red-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      onClick: () => setActiveUsersModalOpen(true),
      clickable: true,
    },
    {
      title: 'Conversion Rate',
      value: stats?.orders_today && stats?.active_users_today 
        ? `${((stats.orders_today / stats.active_users_today) * 100).toFixed(1)}%`
        : '0%',
      icon: TrendingUp,
      trend: 0.5,
      trendUp: true,
      bgGradient: 'from-purple-50 to-pink-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  const secondaryStats = [
    { 
      label: 'Avg Order Value', 
      value: stats?.orders_today && stats?.revenue_today 
        ? formatCurrency(stats.revenue_today / stats.orders_today) 
        : formatCurrency(0), 
      change: '+5.2%', 
      changeUp: true 
    },
    { 
      label: 'Cart Abandonment', 
      value: stats?.abandoned_carts && stats?.active_carts 
        ? `${((stats.abandoned_carts / (stats.active_carts + stats.abandoned_carts)) * 100).toFixed(1)}%`
        : '0%', 
      change: '-2.1%', 
      changeUp: false 
    },
    { 
      label: 'Response Time', 
      value: `${stats?.avg_api_response_ms || 0}ms`, 
      change: '-12%', 
      changeUp: true 
    },
    { 
      label: 'Failed Logins', 
      value: stats?.failed_logins_last_hour || 0, 
      change: '-8%', 
      changeUp: true 
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Welcome back! Here's what's happening with your store today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {(['today', 'week', 'month'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1.5 text-sm rounded-md transition capitalize ${
                      selectedPeriod === period 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
                  </button>
                ))}
              </div>
              
              {/* Refresh Button */}
              <button 
                onClick={fetchDashboardData} 
                disabled={refreshing} 
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-[1440px] mx-auto">
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  onClick={stat.onClick}
                  className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition group ${
                    stat.clickable ? 'cursor-pointer hover:border-orange-200 dark:hover:border-orange-800' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center`}>
                      <Icon size={20} className={stat.iconColor} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full`}>
                      {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(stat.trend)}%
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.title}</p>
                </div>
              );
            })}
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {secondaryStats.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                  <span className={`text-xs font-medium ${stat.changeUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Revenue Overview</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {selectedPeriod === 'today' ? 'Hourly' : selectedPeriod === 'week' ? 'Daily' : 'Weekly'} revenue
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span> Revenue
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                  <XAxis dataKey={xAxisKey} tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip 
                    formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                    contentStyle={{ backgroundColor: 'var(--tw-bg-white)', borderColor: '#E5E7EB', borderRadius: '0.5rem' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Orders vs Views Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Traffic vs Orders</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {selectedPeriod === 'today' ? 'Last 24 hours' : selectedPeriod === 'week' ? 'Last 7 days' : 'Last 4 weeks'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Views</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Orders</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                  <XAxis dataKey={xAxisKey} tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--tw-bg-white)', borderColor: '#E5E7EB', borderRadius: '0.5rem' }} />
                  <Line yAxisId="left" type="monotone" dataKey="views" stroke="#F97316" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Top Products */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Performing Products</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Most viewed products this week</p>
                </div>
                <button className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1">
                  View all <ArrowUpRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {topProducts.slice(0, 5).map((product, idx) => (
                  <div key={product.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{product.product_name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{product.view_count} views</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(product.revenue || product.view_count * 8500)}
                      </p>
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <div className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                    No product data available
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity / API Logs */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent API Activity</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Latest requests to your store</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[320px] overflow-y-auto">
                {apiLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        log.method === 'GET' 
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' 
                          : log.method === 'POST' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                      }`}>
                        {log.method}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">{log.endpoint}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(log.started_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${
                        log.status >= 200 && log.status < 300 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                          : log.status >= 400 
                            ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' 
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                      }`}>
                        {log.status}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{log.response_time_ms}ms</p>
                    </div>
                  </div>
                ))}
                {apiLogs.length === 0 && (
                  <div className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                    No API activity yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Status & Test Account Control */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* System Health */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <Server size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">System Health</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">API Gateway</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Real-time Stream</span>
                  <span className={`flex items-center gap-1 text-xs ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    {isConnected ? 'Active' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cache Layer</span>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Errors */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Errors</h2>
                {recentErrors.length > 0 && (
                  <span className="text-xs bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                    {recentErrors.length}
                  </span>
                )}
              </div>
              {recentErrors.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500 dark:text-emerald-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No errors in the last 24 hours</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {recentErrors.slice(0, 3).map((error) => (
                    <div key={error.id} className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-red-600 dark:text-red-400">{error.error_type}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(error.occurred_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{error.error_message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Account Control */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <TestAccountKillSwitch />
            </div>
          </div>
        </div>
      </div>

      {/* Active Users Modal */}
      {activeUsersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Users (Last 15 Minutes)</h2>
                <span className="bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 text-xs px-2 py-0.5 rounded-full">
                  {realtimeUsers?.count || 0} active
                </span>
              </div>
              <button 
                onClick={() => setActiveUsersModalOpen(false)} 
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                aria-label="Close modal"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(85vh-70px)] p-5">
              {!realtimeUsers?.users || realtimeUsers.users.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No active users at the moment</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(realtimeUsers.users as RealtimeUser[]).map((user) => (
                    <div key={user.session_id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {user.user_name || user.user_email || 'Guest'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {Math.floor(user.seconds_ago / 60)} min ago
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Monitor size={10} /> {user.page_url?.split('/').pop() || '/'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {user.ip_address}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
