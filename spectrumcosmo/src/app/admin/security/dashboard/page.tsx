'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  Users,
  Ban,
  Clock,
  RefreshCw,
  Eye,
  ChevronRight,
  Calendar,
  MapPin,
  Server,
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

interface DashboardData {
  summary: {
    total_events: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unique_ips: number;
  };
  dailyTrends: Array<{ date: string; total: number; threats: number }>;
  topAttacks: Array<{ action_type: string; count: number }>;
  topIPs: Array<{ ip_address: string; attempts: number; blocked: number }>;
  recentAlerts: Array<{
    id: number;
    action_type: string;
    severity: string;
    ip_address: string;
    details: any;
    created_at: string;
  }>;
  systemHealth: {
    rate_limits_active: Array<{ count: number }>;
    blocked_ips: Array<{ count: number }>;
    active_sessions: Array<{ count: number }>;
  };
}

const severityColors = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
};

export default function SecurityDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(7);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/security/dashboard?days=${days}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch security dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [days]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border p-5 h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pieData = data ? [
    { name: 'Critical', value: data.summary.critical, color: severityColors.critical },
    { name: 'High', value: data.summary.high, color: severityColors.high },
    { name: 'Medium', value: data.summary.medium, color: severityColors.medium },
    { name: 'Low', value: data.summary.low, color: severityColors.low },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Shield size={32} className="text-[#F97316]" />
              <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
            </div>
            <p className="text-gray-500 mt-1">Real-time security monitoring and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <Activity size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400">Total Events</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data?.summary.total_events || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Security events logged</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle size={20} className="text-red-500" />
              <span className="text-xs text-red-500">Critical Threats</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{data?.summary.critical || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Require immediate attention</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <Users size={20} className="text-purple-500" />
              <span className="text-xs text-purple-500">Unique IPs</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{data?.summary.unique_ips || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Suspicious sources</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <Ban size={20} className="text-orange-500" />
              <span className="text-xs text-orange-500">Threat Level</span>
            </div>
            <p className={`text-2xl font-bold ${
              (data?.summary.critical || 0) > 10 ? 'text-red-600' :
              (data?.summary.high || 0) > 20 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {(data?.summary.critical || 0) > 10 ? 'High' :
               (data?.summary.high || 0) > 20 ? 'Medium' : 'Low'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Current risk level</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.dailyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#F97316" name="Total Events" />
                <Line type="monotone" dataKey="threats" stroke="#EF4444" name="Threats" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Types & Top IPs */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Attack Types</h2>
            <div className="space-y-3">
              {(data?.topAttacks || []).map((attack, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-mono text-xs">{attack.action_type}</span>
                    <span className="text-gray-500">{attack.count} attempts</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (attack.count / (data?.topAttacks[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!data?.topAttacks || data.topAttacks.length === 0) && (
                <p className="text-center text-gray-500 py-8">No attack data available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Top Offending IPs</h2>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">IP Address</th>
                    <th className="px-4 py-2 text-left">Attempts</th>
                    <th className="px-4 py-2 text-left">Blocked</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.topIPs || []).map((ip, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">{ip.ip_address}</td>
                      <td className="px-4 py-2">{ip.attempts}</td>
                      <td className="px-4 py-2">
                        {ip.blocked > 0 ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            {ip.blocked}x blocked
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!data?.topIPs || data.topIPs.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No suspicious IPs detected
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl border overflow-hidden mb-8">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900">Recent High Severity Alerts</h2>
            </div>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {(data?.recentAlerts || []).map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{alert.action_type}</span>
                      </div>
                      <p className="text-xs text-gray-500">IP: {alert.ip_address}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                      {alert.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer">View details</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(alert.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!data?.recentAlerts || data.recentAlerts.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                <p>No high severity alerts in the last 24 hours</p>
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Server size={20} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Active Rate Limits</p>
                <p className="text-sm font-medium text-green-600">
                  {data?.systemHealth.rate_limits_active?.[0]?.count || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Ban size={20} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Blocked IPs</p>
                <p className="text-sm font-medium text-orange-600">
                  {data?.systemHealth.blocked_ips?.[0]?.count || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users size={20} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Active Sessions</p>
                <p className="text-sm font-medium text-blue-600">
                  {data?.systemHealth.active_sessions?.[0]?.count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
