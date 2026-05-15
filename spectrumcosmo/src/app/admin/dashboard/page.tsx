'use client';

import { useEffect, useState } from 'react';
import {
  Loader2,
  TrendingUp,
  ShoppingBag,
  Users,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Server,
  Database,
  RefreshCw,
} from 'lucide-react';
import {
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardStats {
  active_users_today: number;
  orders_today: number;
  revenue_today: number;
  abandoned_carts: number;
  active_carts: number;
  failed_payments: number;
  avg_api_response_ms: number;
  failed_logins_last_hour: number;
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
}

interface ErrorLog {
  id: number;
  error_type: string;
  error_message: string;
  severity: string;
  occurred_at: string;
  resolved: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [topProducts, setTopProducts] = useState<ProductView[]>([]);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, apiLogsRes, productsRes, errorsRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/api-logs?limit=10'),
        fetch('/api/admin/dashboard/top-products?limit=5'),
        fetch('/api/admin/dashboard/recent-errors?limit=10'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (apiLogsRes.ok) setApiLogs(await apiLogsRes.json());
      if (productsRes.ok) setTopProducts(await productsRes.json());
      if (errorsRes.ok) setRecentErrors(await errorsRes.json());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-[#F97316]" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Users (24h)',
      value: stats?.active_users_today || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Orders Today',
      value: stats?.orders_today || 0,
      icon: ShoppingBag,
      color: 'bg-green-500',
      change: '+5%',
    },
    {
      title: 'Revenue Today',
      value: `$${(stats?.revenue_today || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+8%',
    },
    {
      title: 'Abandoned Carts',
      value: stats?.abandoned_carts || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '-3%',
    },
    {
      title: 'Active Carts',
      value: stats?.active_carts || 0,
      icon: Clock,
      color: 'bg-purple-500',
      change: '+2%',
    },
    {
      title: 'Failed Payments',
      value: stats?.failed_payments || 0,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      change: '-1%',
    },
    {
      title: 'Avg API Response',
      value: `${stats?.avg_api_response_ms || 0}ms`,
      icon: Activity,
      color: 'bg-teal-500',
      change: stats?.avg_api_response_ms && stats.avg_api_response_ms < 200 ? 'Good' : 'Slow',
    },
    {
      title: 'Failed Logins (1h)',
      value: stats?.failed_logins_last_hour || 0,
      icon: AlertTriangle,
      color: 'bg-red-600',
      change: stats?.failed_logins_last_hour && stats.failed_logins_last_hour > 10 ? 'High' : 'Normal',
    },
  ];

  const chartData = [
    { hour: '00:00', views: 120, orders: 5 },
    { hour: '04:00', views: 80, orders: 2 },
    { hour: '08:00', views: 250, orders: 12 },
    { hour: '12:00', views: 450, orders: 25 },
    { hour: '16:00', views: 380, orders: 18 },
    { hour: '20:00', views: 300, orders: 15 },
  ];

  const statusColors = {
    success: 'text-green-600 bg-green-100',
    error: 'text-red-600 bg-red-100',
    warning: 'text-yellow-600 bg-yellow-100',
  };

  const severityColors = {
    error: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
    critical: 'bg-purple-100 text-purple-700',
  };

  const COLORS = ['#F97316', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time analytics and monitoring</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                    <Icon size={20} className={`${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                  <span className={`text-xs font-medium ${stat.change?.startsWith('+') ? 'text-green-600' : stat.change?.startsWith('-') ? 'text-red-600' : 'text-gray-500'}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Traffic Chart */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic & Orders</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="views" stroke="#F97316" name="Page Views" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products Chart */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Viewed Products</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts.length ? topProducts : [{ name: 'No data', views: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="view_count" fill="#F97316" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* API Logs */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Recent API Calls</h2>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Endpoint</th>
                    <th className="px-4 py-2 text-left">Method</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Time</th>
                    <th className="px-4 py-2 text-left">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {apiLogs.map((log) => (
                    <tr key={log.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 truncate max-w-[200px]">{log.endpoint}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                          log.method === 'POST' ? 'bg-green-100 text-green-700' :
                          log.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.status >= 200 && log.status < 300 ? 'bg-green-100 text-green-700' :
                          log.status >= 400 ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">{log.response_time_ms}ms</td>
                      <td className="px-4 py-2 text-xs">{log.ip_address || '-'}</td>
                    </tr>
                  ))}
                  {apiLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No API logs yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Errors */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Errors</h2>
              <span className="text-xs text-gray-500">Last 24 hours</span>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {recentErrors.map((error) => (
                <div key={error.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[error.severity as keyof typeof severityColors] || 'bg-gray-100 text-gray-700'}`}>
                        {error.severity || 'error'}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{error.error_type}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(error.occurred_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{error.error_message}</p>
                  {!error.resolved && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs text-orange-600">
                      <AlertTriangle size={12} />
                      Unresolved
                    </span>
                  )}
                </div>
              ))}
              {recentErrors.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                  <p>No errors in the last 24 hours</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Server size={20} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Database Status</p>
                <p className="text-sm font-medium text-green-600">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Activity size={20} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">API Health</p>
                <p className="text-sm font-medium text-green-600">Normal</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Database size={20} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Cache Status</p>
                <p className="text-sm font-medium text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
