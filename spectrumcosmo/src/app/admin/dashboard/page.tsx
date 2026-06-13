'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Loader2,
  ShoppingBag,
  Users,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Server,
  RefreshCw,
  X,
  TrendingUp,
  TrendingDown,
  Monitor,
  LogIn,
  Shield,
  Smartphone,
  Laptop,
  Tablet,
  Clock,
  MapPin,
  Eye,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRealtimeActiveUsers } from '@/hooks/useRealtimeActiveUsers';
import TestAccountKillSwitch from '@/components/admin/TestAccountKillSwitch';

// Types
interface DashboardStats {
  revenue_today: number;
  orders_today: number;
  active_users_today: number;
  abandoned_carts: number;
  active_carts: number;
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
  revenue: number;
  total_quantity: number;
}

interface ErrorLog {
  id: number;
  error_type: string;
  error_message: string;
  occurred_at: string;
}

interface LoginActivity {
  id: number;
  status: number;
  timestamp: string;
  ip_address: string;
}

interface StatCard {
  title: string;
  value: string;
  icon: any;
  trend: number;
  trendUp: boolean;
  bgGradient: string;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
  clickable?: boolean;
}

interface SecondaryStat {
  label: string;
  value: string;
  onClick?: () => void;
  clickable?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-MW', { 
    style: 'currency', 
    currency: 'MWK', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-MW').format(num);
};

const getDeviceIcon = (deviceType: string) => {
  if (deviceType === 'Mobile') return <Smartphone size={12} />;
  if (deviceType === 'Tablet') return <Tablet size={12} />;
  return <Laptop size={12} />;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [topProducts, setTopProducts] = useState<ProductView[]>([]);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [loginSummary, setLoginSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [activeUsersTimeFilter, setActiveUsersTimeFilter] = useState<'15min' | '30min' | '1hour' | '24hour'>('15min');
  
  const { data: realtimeUsers, isConnected, refresh: refreshUsers } = useRealtimeActiveUsers();

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [
        statsRes,
        apiLogsRes,
        productsRes,
        errorsRes,
        revenueRes,
        loginRes,
      ] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/api-logs?limit=10'),
        fetch('/api/admin/dashboard/top-products?limit=5'),
        fetch('/api/admin/dashboard/recent-errors?limit=10'),
        fetch(`/api/admin/dashboard/revenue-graph?period=${selectedPeriod}`),
        fetch('/api/admin/dashboard/login-activity?limit=20'),
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
      if (revenueRes.ok) {
        const revenueData = await revenueRes.json();
        setChartData(revenueData);
      }
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        setLoginActivities(loginData.activities || []);
        setLoginSummary(loginData.summary);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const getChartXAxisKey = () => {
    if (selectedPeriod === 'today') return 'hour';
    if (selectedPeriod === 'week') return 'day';
    return 'week_label';
  };

  // Filter active users by time
  const getFilteredActiveUsers = () => {
    if (!realtimeUsers?.users) return [];
    const now = Date.now();
    return realtimeUsers.users.filter((user: any) => {
      const userTime = new Date(user.last_seen || user.timestamp || Date.now()).getTime();
      const diffMinutes = (now - userTime) / (1000 * 60);
      if (activeUsersTimeFilter === '15min') return diffMinutes <= 15;
      if (activeUsersTimeFilter === '30min') return diffMinutes <= 30;
      if (activeUsersTimeFilter === '1hour') return diffMinutes <= 60;
      return true; // 24 hours
    });
  };

  const statCards: StatCard[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.revenue_today || 0),
      icon: DollarSign,
      trend: stats?.revenue_growth || 0,
      trendUp: (stats?.revenue_growth || 0) >= 0,
      bgGradient: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Total Orders',
      value: formatNumber(stats?.orders_today || 0),
      icon: ShoppingBag,
      trend: stats?.orders_growth || 0,
      trendUp: (stats?.orders_growth || 0) >= 0,
      bgGradient: 'from-blue-50 to-indigo-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Users',
      value: formatNumber(realtimeUsers?.count || 0),
      icon: Users,
      trend: isConnected ? 100 : 0,
      trendUp: true,
      bgGradient: 'from-orange-50 to-red-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      onClick: () => setShowActiveUsersModal(true),
      clickable: true,
    },
    {
      title: 'Conversion Rate',
      value: stats?.orders_today && stats?.active_users_today && stats.active_users_today > 0
        ? `${((stats.orders_today / stats.active_users_today) * 100).toFixed(1)}%`
        : '0%',
      icon: TrendingUp,
      trend: 0,
      trendUp: true,
      bgGradient: 'from-purple-50 to-pink-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  const secondaryStats: SecondaryStat[] = [
    { 
      label: 'Avg Order Value', 
      value: stats?.orders_today && stats?.revenue_today && stats.orders_today > 0
        ? formatCurrency(stats.revenue_today / stats.orders_today) 
        : formatCurrency(0), 
    },
    { 
      label: 'Cart Abandonment', 
      value: stats?.abandoned_carts !== undefined ? `${stats.abandoned_carts}%` : '0%', 
    },
    { 
      label: 'API Response Time', 
      value: `${stats?.avg_api_response_ms || 0}ms`, 
    },
    { 
      label: 'Failed Logins', 
      value: formatNumber(stats?.failed_logins_last_hour || 0), 
      onClick: () => setShowLoginModal(true),
      clickable: true,
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

  const filteredUsers = getFilteredActiveUsers();
  const filteredCount = filteredUsers.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
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
                  onClick={stat.onClick || undefined}
                  className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition ${
                    stat.clickable ? 'cursor-pointer hover:border-orange-200 dark:hover:border-orange-800' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center`}>
                      <Icon size={20} className={stat.iconColor} />
                    </div>
                    {stat.trend !== 0 && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-red-600'} bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full`}>
                        {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(stat.trend)}%
                      </div>
                    )}
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
              <div 
                key={index} 
                onClick={stat.onClick || undefined}
                className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 shadow-sm ${stat.clickable ? 'cursor-pointer hover:border-orange-200' : ''}`}
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Revenue Overview</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {selectedPeriod === 'today' ? 'Hourly' : selectedPeriod === 'week' ? 'Daily' : 'Weekly'} revenue
                  </p>
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
                  <XAxis dataKey={getChartXAxisKey()} tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip 
                    formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#E5E7EB', borderRadius: '0.5rem' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Orders vs Revenue</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {selectedPeriod === 'today' ? 'Last 24 hours' : selectedPeriod === 'week' ? 'Last 7 days' : 'Last 4 weeks'}
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                  <XAxis dataKey={getChartXAxisKey()} tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `${v/1000}k`} />
                  <Tooltip 
                    formatter={(v: number, name: string) => {
                      if (name === 'orders') return [v, 'Orders'];
                      return [formatCurrency(v), 'Revenue'];
                    }}
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#E5E7EB', borderRadius: '0.5rem' }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} dot={false} />
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
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Most revenue generated</p>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {topProducts.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                    No product data available
                  </div>
                ) : (
                  topProducts.map((product, idx) => (
                    <div key={product.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{product.product_name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{product.total_quantity || 0} sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(product.revenue || 0)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent API Activity */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent API Activity</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Latest requests to your store</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[320px] overflow-y-auto">
                {apiLogs.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                    No API activity yet
                  </div>
                ) : (
                  apiLogs.map((log) => (
                    <div key={log.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          log.method === 'GET' 
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' 
                            : log.method === 'POST' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' 
                              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
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
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' 
                            : log.status >= 400 
                              ? 'bg-red-50 dark:bg-red-950/30 text-red-600' 
                              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
                        }`}>
                          {log.status}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{log.response_time_ms}ms</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="grid lg:grid-cols-3 gap-6">
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
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Real-time Stream</span>
                  <span className={`flex items-center gap-1 text-xs ${isConnected ? 'text-emerald-600' : 'text-red-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    {isConnected ? 'Active' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-amber-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Errors</h2>
              </div>
              {recentErrors.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm text-gray-500">No errors in the last 24 hours</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {recentErrors.slice(0, 3).map((error) => (
                    <div key={error.id} className="p-2 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-red-600">{error.error_type}</span>
                        <span className="text-xs text-gray-400">{new Date(error.occurred_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{error.error_message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <TestAccountKillSwitch />
            </div>
          </div>
        </div>
      </div>

      {/* Active Users Modal - Enhanced with Time Filters */}
      {showActiveUsersModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Users</h2>
                <span className="bg-orange-100 dark:bg-orange-950/50 text-orange-600 text-xs px-2 py-0.5 rounded-full">
                  {filteredCount} active
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Time filter buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveUsersTimeFilter('15min')}
                    className={`px-2.5 py-1 text-xs rounded-md transition ${
                      activeUsersTimeFilter === '15min' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    15 min
                  </button>
                  <button
                    onClick={() => setActiveUsersTimeFilter('30min')}
                    className={`px-2.5 py-1 text-xs rounded-md transition ${
                      activeUsersTimeFilter === '30min' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    30 min
                  </button>
                  <button
                    onClick={() => setActiveUsersTimeFilter('1hour')}
                    className={`px-2.5 py-1 text-xs rounded-md transition ${
                      activeUsersTimeFilter === '1hour' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    1 hour
                  </button>
                  <button
                    onClick={() => setActiveUsersTimeFilter('24hour')}
                    className={`px-2.5 py-1 text-xs rounded-md transition ${
                      activeUsersTimeFilter === '24hour' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    24 hours
                  </button>
                </div>
                <button 
                  onClick={() => {
                    refreshUsers();
                    setActiveUsersTimeFilter('15min');
                  }} 
                  className="p-1.5 hover:bg-gray-100 rounded-full transition"
                  title="Refresh"
                >
                  <RefreshCw size={16} className="text-gray-500" />
                </button>
                <button 
                  onClick={() => setShowActiveUsersModal(false)} 
                  className="p-1 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(85vh-70px)] p-5">
              {filteredCount === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No active users in the last {activeUsersTimeFilter === '15min' ? '15 minutes' : activeUsersTimeFilter === '30min' ? '30 minutes' : activeUsersTimeFilter === '1hour' ? 'hour' : '24 hours'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <div className="col-span-4">User</div>
                    <div className="col-span-3">Current Page</div>
                    <div className="col-span-2">Device / Browser</div>
                    <div className="col-span-2">IP Address</div>
                    <div className="col-span-1">Last Active</div>
                  </div>
                  
                  {/* User Rows */}
                  {filteredUsers.map((user: any) => (
                    <div 
                      key={user.session_id} 
                      className="grid grid-cols-12 gap-3 px-3 py-3 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <div className="col-span-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {user.user_name || user.user_email || 'Guest'}
                            </p>
                            {user.user_email && (
                              <p className="text-xs text-gray-400 truncate">{user.user_email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate" title={user.page_url}>
                          {user.page_url?.split('/').pop() || '/'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {getDeviceIcon(user.device_type)}
                          <span className="text-xs text-gray-500">{user.device_type || 'Unknown'}</span>
                          {user.browser && (
                            <span className="text-xs text-gray-400 ml-1">({user.browser})</span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <code className="text-xs text-gray-500">{user.ip_address || 'N/A'}</code>
                      </div>
                      <div className="col-span-1">
                        <span className="text-xs text-gray-400">
                          {user.seconds_ago < 60 
                            ? `${user.seconds_ago}s ago` 
                            : `${Math.floor(user.seconds_ago / 60)}m ago`}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Refresh Hint */}
                  <div className="text-center pt-4">
                    <p className="text-xs text-gray-400">
                      <Activity size={10} className="inline mr-1" />
                      Auto-refreshes every 10 seconds
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Activity Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div className="flex items-center gap-2">
                <LogIn size={20} className="text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Login Activity</h2>
                {loginSummary && (
                  <div className="flex gap-2 ml-3">
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                      Success: {loginSummary.successful_attempts}
                    </span>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      Failed: {loginSummary.failed_attempts}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={() => setShowLoginModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(85vh-70px)] p-5">
              {loginActivities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No login activity recorded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-semibold text-gray-500 border-b">
                    <div className="col-span-5">Event</div>
                    <div className="col-span-3">IP Address</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Time</div>
                  </div>
                  {loginActivities.map((activity) => (
                    <div key={activity.id} className="grid grid-cols-12 gap-3 px-3 py-3 border border-gray-100 rounded-lg">
                      <div className="col-span-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${activity.status < 400 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm text-gray-900">
                            {activity.status < 400 ? 'Successful login' : 'Failed login attempt'}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <code className="text-xs text-gray-500">{activity.ip_address}</code>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          activity.status < 400 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleTimeString()}</span>
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
