'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  Ban,
  Clock,
  RefreshCw,
  Loader2,
  Search,
  X,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface SecurityLog {
  id: number;
  user_id: number | null;
  action_type: string;
  endpoint: string;
  ip_address: string;
  response_status: number;
  risk_score: number;
  risk_level: string;
  created_at: string;
  user_name?: string;
}

interface BlockedIP {
  id: number;
  ip_address: string;
  reason: string;
  expires_at: string;
}

interface RiskSummary {
  total_requests: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  unique_ips: number;
  blocked_ips: number;
}

const COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
};

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-5 h-24"></div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-6 h-80"></div>
          <div className="bg-white rounded-xl border p-6 h-80"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function SecurityCenter() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedIP, setSelectedIP] = useState<BlockedIP | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [logsRes, blockedRes, summaryRes] = await Promise.all([
        fetch('/api/admin/security/logs'),
        fetch('/api/admin/security/blocked-ips'),
        fetch('/api/admin/security/summary'),
      ]);
      
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
      }
      if (blockedRes.ok) {
        const data = await blockedRes.json();
        setBlockedIPs(data);
      }
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch security data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const unblockIP = async (ipAddress: string) => {
    try {
      await fetch('/api/admin/security/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to unblock IP:', err);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (selectedRisk !== 'all' && log.risk_level !== selectedRisk) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return log.ip_address.includes(query) || 
             log.action_type.toLowerCase().includes(query);
    }
    return true;
  });

  const chartData = [
    { hour: '00:00', critical: 2, high: 5, medium: 12, low: 45 },
    { hour: '04:00', critical: 1, high: 3, medium: 8, low: 32 },
    { hour: '08:00', critical: 5, high: 12, medium: 25, low: 89 },
    { hour: '12:00', critical: 8, high: 15, medium: 35, low: 120 },
    { hour: '16:00', critical: 6, high: 10, medium: 28, low: 95 },
    { hour: '20:00', critical: 3, high: 7, medium: 18, low: 67 },
  ];

  const pieData = summary ? [
    { name: 'Critical', value: summary.critical_count, color: COLORS.critical },
    { name: 'High', value: summary.high_count, color: COLORS.high },
    { name: 'Medium', value: summary.medium_count, color: COLORS.medium },
    { name: 'Low', value: summary.low_count, color: COLORS.low },
  ] : [];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Shield size={32} className="text-[#F97316]" />
              <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
            </div>
            <p className="text-gray-500 mt-1">
              Real-time threat monitoring and automated protection
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <Activity size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400">Last 24h</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary?.total_requests || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total Requests</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle size={20} className="text-red-500" />
              <span className="text-xs text-red-500">Critical</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{summary?.critical_count || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Critical Risks</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle size={20} className="text-orange-500" />
              <span className="text-xs text-orange-500">High</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{summary?.high_count || 0}</p>
            <p className="text-sm text-gray-500 mt-1">High Risks</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <Eye size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400">IPs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary?.unique_ips || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Unique IPs</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <Ban size={20} className="text-red-500" />
              <span className="text-xs text-red-500">Blocked</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{summary?.blocked_ips || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Blocked IPs</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="critical" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                <Area type="monotone" dataKey="high" stackId="1" stroke="#F97316" fill="#F97316" fillOpacity={0.6} />
                <Area type="monotone" dataKey="medium" stackId="1" stroke="#EAB308" fill="#EAB308" fillOpacity={0.6} />
                <Area type="monotone" dataKey="low" stackId="1" stroke="#22C55E" fill="#22C55E" fillOpacity={0.6} />
              </AreaChart>
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
                  fill="#8884d8"
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

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRisk('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedRisk === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedRisk('critical')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedRisk === 'critical' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setSelectedRisk('high')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedRisk === 'high' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setSelectedRisk('medium')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedRisk === 'medium' ? 'bg-yellow-600 text-white' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                }`}
              >
                Medium
              </button>
            </div>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search IP, action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />
            </div>
          </div>
        </div>

        {/* Security Logs Table */}
        <div className="bg-white rounded-xl border overflow-hidden mb-8">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Security Event Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">IP Address</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Risk</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono">{log.action_type}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{log.ip_address}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.response_status >= 200 && log.response_status < 300 ? 'bg-green-100 text-green-700' :
                        log.response_status >= 400 ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.response_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.risk_level === 'critical' ? 'bg-purple-100 text-purple-700' :
                        log.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                        log.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {log.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                      <p>No security events found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Blocked IPs Section */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Blocked IP Addresses</h2>
          </div>
          <div className="divide-y">
            {blockedIPs.map((ip) => (
              <div key={ip.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Ban size={18} className="text-red-500" />
                  <div>
                    <p className="font-mono text-sm font-medium">{ip.ip_address}</p>
                    <p className="text-xs text-gray-500">{ip.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">
                    Expires: {new Date(ip.expires_at).toLocaleString()}
                  </span>
                  <button
                    onClick={() => unblockIP(ip.ip_address)}
                    className="text-sm text-[#F97316] hover:underline"
                  >
                    Unblock
                  </button>
                </div>
              </div>
            ))}
            {blockedIPs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                <p>No IP addresses are currently blocked</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
