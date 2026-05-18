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
  Zap,
  Lock,
  Unlock,
  Filter,
  ChevronDown,
  Plus,
  Save,
  Settings as SettingsIcon,
  Globe,
  MapPin,
  Calendar,
  TrendingUp as TrendingUpIcon,
  BarChart3,
  PieChart as PieChartIcon,
  Bell,
  Users,
  Server,
  Database,
  Trash2,
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
  BarChart,
  Bar,
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
  blocked: boolean;
  user_agent?: string;
}

interface BlockedIP {
  id: number;
  ip_address: string;
  reason: string;
  expires_at: string;
}

interface SecurityAlert {
  id: number;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  ip_address: string;
  endpoint: string;
  action_taken: string;
  resolved: boolean;
  created_at: string;
}

interface ProtectionRule {
  id: number;
  rule_type: string;
  identifier: string;
  max_requests: number;
  window_seconds: number;
  action: string;
  expires_at: string | null;
}

interface AttackStats {
  attack_type: string;
  count: number;
  color: string;
}

interface EndpointAttack {
  endpoint: string;
  attack_count: number;
  percentage: number;
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

const ATTACK_COLORS = {
  brute_force: '#EF4444',
  sql_injection: '#F97316',
  xss: '#EAB308',
  scraping: '#8B5CF6',
  bot: '#06B6D4',
  other: '#6B7280',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);
  
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [protectionRules, setProtectionRules] = useState<ProtectionRule[]>([]);
  const [attackTypes, setAttackTypes] = useState<AttackStats[]>([]);
  const [topEndpoints, setTopEndpoints] = useState<EndpointAttack[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [resolvingAlert, setResolvingAlert] = useState<number | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_type: 'ip',
    max_requests: 60,
    window_seconds: 60,
    action: 'block',
  });
  
  const [selectedIPDetail, setSelectedIPDetail] = useState<string | null>(null);
  const [ipActivity, setIPActivity] = useState<SecurityLog[]>([]);
  const [ipModalOpen, setIpModalOpen] = useState(false);
  const [loadingIPDetail, setLoadingIPDetail] = useState(false);
  
  const [protectionSettings, setProtectionSettings] = useState({
    maxFailedAttempts: 10,
    blockDurationMinutes: 30,
    rateLimitPerMinute: 60,
    enableCaptchaAfterAttempts: 5,
    autoBlockEnabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [logsRes, blockedRes, summaryRes, alertsRes, rulesRes, attacksRes, endpointsRes] = await Promise.all([
        fetch('/api/admin/security/logs'),
        fetch('/api/admin/security/blocked-ips'),
        fetch('/api/admin/security/summary'),
        fetch('/api/admin/security/alerts'),
        fetch('/api/admin/security/rules'),
        fetch('/api/admin/security/attack-stats'),
        fetch('/api/admin/security/top-endpoints'),
      ]);
      
      if (logsRes.ok) setLogs(await logsRes.json());
      if (blockedRes.ok) setBlockedIPs(await blockedRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (rulesRes.ok) setProtectionRules(await rulesRes.json());
      if (attacksRes.ok) setAttackTypes(await attacksRes.json());
      if (endpointsRes.ok) setTopEndpoints(await endpointsRes.json());
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

  const resolveAlert = async (alertId: number) => {
    setResolvingAlert(alertId);
    try {
      await fetch('/api/admin/security/resolve-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setResolvingAlert(null);
    }
  };

  const saveProtectionSettings = async () => {
    setSavingSettings(true);
    try {
      await fetch('/api/admin/security/protection-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protectionSettings),
      });
      alert('Protection settings saved');
      setSettingsModalOpen(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const addRateLimitRule = async () => {
    try {
      await fetch('/api/admin/security/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
      setShowAddRule(false);
      setNewRule({ rule_type: 'ip', max_requests: 60, window_seconds: 60, action: 'block' });
      fetchData();
    } catch (err) {
      console.error('Failed to add rule:', err);
    }
  };

  const viewIPDetails = async (ipAddress: string) => {
    setSelectedIPDetail(ipAddress);
    setIpModalOpen(true);
    setLoadingIPDetail(true);
    try {
      const res = await fetch(`/api/admin/security/ip-activity?ip=${encodeURIComponent(ipAddress)}`);
      if (res.ok) {
        const data = await res.json();
        setIPActivity(data);
      }
    } catch (err) {
      console.error('Failed to fetch IP activity:', err);
    } finally {
      setLoadingIPDetail(false);
    }
  };

  const deleteRule = async (ruleId: number) => {
    try {
      await fetch(`/api/admin/security/rules?id=${ruleId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (selectedRisk !== 'all' && log.risk_level !== selectedRisk) return false;
    if (showBlockedOnly && !log.blocked) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return log.ip_address.includes(query) || 
             log.action_type.toLowerCase().includes(query) ||
             log.endpoint.toLowerCase().includes(query);
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
    { name: 'Critical', value: summary.critical_count, color: '#EF4444' },
    { name: 'High', value: summary.high_count, color: '#F97316' },
    { name: 'Medium', value: summary.medium_count, color: '#EAB308' },
    { name: 'Low', value: summary.low_count, color: '#22C55E' },
  ] : [];

  const getAlertSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-purple-100 text-purple-700';
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

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
            <p className="text-gray-500 mt-1">Real-time threat monitoring and automated protection</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition"
            >
              <SettingsIcon size={16} />
              Protection Settings
            </button>
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

        {/* Section 1: Security Overview Cards */}
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
              <Ban size={20} className="text-red-500" />
              <span className="text-xs text-red-500">Blocked</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{summary?.blocked_ips || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Blocked Threats</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle size={20} className="text-orange-500" />
              <span className="text-xs text-orange-500">Failed Logins</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{summary?.high_count || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Failed Attempts</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <Users size={20} className="text-yellow-500" />
              <span className="text-xs text-yellow-500">Suspicious IPs</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{blockedIPs.length}</p>
            <p className="text-sm text-gray-500 mt-1">Active Suspicious IPs</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <Shield size={20} className="text-green-500" />
              <span className="text-xs text-green-500">System Threat Level</span>
            </div>
            <p className={`text-2xl font-bold ${
              (summary?.critical_count || 0) > 5 ? 'text-red-600' :
              (summary?.high_count || 0) > 10 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {(summary?.critical_count || 0) > 5 ? 'High' :
               (summary?.high_count || 0) > 10 ? 'Medium' : 'Low'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Risk Level</p>
          </div>
        </div>

        {/* Section 2: Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic vs Suspicious Activity</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="critical" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Critical" />
                <Area type="monotone" dataKey="high" stackId="1" stroke="#F97316" fill="#F97316" fillOpacity={0.3} name="High" />
                <Area type="monotone" dataKey="medium" stackId="1" stroke="#EAB308" fill="#EAB308" fillOpacity={0.3} name="Medium" />
                <Area type="monotone" dataKey="low" stackId="1" stroke="#22C55E" fill="#22C55E" fillOpacity={0.3} name="Low" />
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

        {/* Section 3: Live Threat Feed */}
        <div className="bg-white rounded-xl border overflow-hidden mb-8">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-[#F97316]" />
                <h2 className="text-lg font-semibold text-gray-900">Live Threat Feed</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBlockedOnly(!showBlockedOnly)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    showBlockedOnly ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Blocked Only
                </button>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search IP, action, endpoint..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">IP Address</th>
                  <th className="px-4 py-2 text-left">Endpoint</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Risk</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, 30).map((log) => (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{log.ip_address}</td>
                    <td className="px-4 py-2 text-xs truncate max-w-[200px]">{log.endpoint}</td>
                    <td className="px-4 py-2 text-xs">{log.action_type}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.risk_level === 'critical' ? 'bg-purple-100 text-purple-700' :
                        log.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                        log.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {log.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {log.blocked ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Blocked</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Allowed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No threat events found
                    </td>
                  </table>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: IP Risk Intelligence */}
        <div className="bg-white rounded-xl border overflow-hidden mb-8">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-[#F97316]" />
                <h2 className="text-lg font-semibold text-gray-900">IP Risk Intelligence</h2>
              </div>
              <span className="text-xs text-gray-500">Click any IP for full activity timeline</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">IP Address</th>
                  <th className="px-4 py-3 text-left">Risk Level</th>
                  <th className="px-4 py-3 text-left">Last Activity</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedIPs.map((ip) => (
                  <tr key={ip.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => viewIPDetails(ip.ip_address)}>
                    <td className="px-4 py-3 font-mono text-sm">{ip.ip_address}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Blocked</span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      Expires: {new Date(ip.expires_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); unblockIP(ip.ip_address); }}
                        className="text-sm text-[#F97316] hover:underline"
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
                {blockedIPs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                      <p>No suspicious IPs detected</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Alerts & Incidents */}
        <div className="bg-white rounded-xl border overflow-hidden mb-8">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900">Alerts & Incidents</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResolved(!showResolved)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {showResolved ? 'Hide resolved' : 'Show resolved'}
              </button>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {alerts.filter(a => !a.resolved).length} active
              </span>
            </div>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {(showResolved ? alerts : alerts.filter(a => !a.resolved)).slice(0, 20).map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className={`mt-0.5 ${
                      alert.severity === 'critical' ? 'text-purple-500' :
                      alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getAlertSeverityBadge(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{alert.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>IP: {alert.ip_address}</span>
                        <span>Endpoint: {alert.endpoint}</span>
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                      {alert.action_taken && (
                        <p className="text-xs text-green-600 mt-1">Action: {alert.action_taken}</p>
                      )}
                    </div>
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      disabled={resolvingAlert === alert.id}
                      className="text-xs text-green-600 hover:underline"
                    >
                      {resolvingAlert === alert.id ? <Loader2 size={12} className="animate-spin" /> : 'Resolve'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 6: Attack Analytics */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attack Types Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={attackTypes.length ? attackTypes : [{ attack_type: 'No data', count: 1, color: '#ccc' }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="attack_type" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Attacks">
                  {attackTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ATTACK_COLORS[entry.attack_type as keyof typeof ATTACK_COLORS] || '#6B7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Attacked Endpoints</h2>
            <div className="space-y-3">
              {topEndpoints.slice(0, 5).map((endpoint, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-mono text-xs truncate max-w-[300px]">{endpoint.endpoint}</span>
                    <span className="text-gray-500">{endpoint.attack_count} attacks</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${endpoint.percentage}%` }} />
                  </div>
                </div>
              ))}
              {topEndpoints.length === 0 && <p className="text-center text-gray-500 py-8">No attack data available</p>}
            </div>
          </div>
        </div>

        {/* Section 7: Protection Controls */}
        <div className="bg-white rounded-xl border overflow-hidden mb-8">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Lock size={20} className="text-[#F97316]" />
              <h2 className="text-lg font-semibold text-gray-900">Protection Controls</h2>
            </div>
            <button onClick={() => setShowAddRule(!showAddRule)} className="flex items-center gap-1 text-sm text-[#F97316] hover:underline">
              <Plus size={14} /> Add Rule
            </button>
          </div>
          
          {showAddRule && (
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex gap-3 items-end">
                <div>
                  <label className="text-xs text-gray-500">Rule Type</label>
                  <select value={newRule.rule_type} onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value })} className="mt-1 px-3 py-1.5 border rounded-lg text-sm">
                    <option value="ip">IP Address</option>
                    <option value="user">User</option>
                    <option value="endpoint">Endpoint</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Max Requests</label>
                  <input type="number" value={newRule.max_requests} onChange={(e) => setNewRule({ ...newRule, max_requests: parseInt(e.target.value) })} className="mt-1 px-3 py-1.5 border rounded-lg text-sm w-24" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Window (seconds)</label>
                  <input type="number" value={newRule.window_seconds} onChange={(e) => setNewRule({ ...newRule, window_seconds: parseInt(e.target.value) })} className="mt-1 px-3 py-1.5 border rounded-lg text-sm w-24" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Action</label>
                  <select value={newRule.action} onChange={(e) => setNewRule({ ...newRule, action: e.target.value })} className="mt-1 px-3 py-1.5 border rounded-lg text-sm">
                    <option value="block">Block</option>
                    <option value="captcha">CAPTCHA</option>
                    <option value="rate_limit">Rate Limit</option>
                  </select>
                </div>
                <button onClick={addRateLimitRule} className="px-4 py-1.5 bg-[#F97316] text-white rounded-lg text-sm">Save</button>
              </div>
            </div>
          )}
          
          <div className="divide-y">
            {protectionRules.map((rule) => (
              <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{rule.rule_type}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{rule.identifier || 'Global'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{rule.max_requests} requests per {rule.window_seconds}s → {rule.action}</p>
                </div>
                <button onClick={() => deleteRule(rule.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {protectionRules.length === 0 && (
              <div className="p-8 text-center text-gray-500"><p>No custom rate limit rules configured</p></div>
            )}
          </div>
        </div>

        {/* Section 8: Security Logs (Raw Data) */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={20} className="text-[#F97316]" />
                <h2 className="text-lg font-semibold text-gray-900">Security Logs (Raw Data)</h2>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Timestamp</th>
                  <th className="px-3 py-2 text-left">IP</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Endpoint</th>
                  <th className="px-3 py-2 text-left">Risk</th>
                  <th className="px-3 py-2 text-left">Blocked</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono">{log.ip_address}</td>
                    <td className="px-3 py-2">{log.action_type}</td>
                    <td className="px-3 py-2 truncate max-w-[200px]">{log.endpoint}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        log.risk_level === 'critical' ? 'bg-purple-100 text-purple-700' :
                        log.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                        log.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {log.risk_level}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {log.blocked ? <Ban size={14} className="text-red-500" /> : <CheckCircle size={14} className="text-green-500" />}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No security logs available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* IP Detail Modal */}
      {ipModalOpen && selectedIPDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <div className="flex items-center gap-2"><Eye size={20} className="text-[#F97316]" /><h2 className="text-lg font-semibold">IP Activity: {selectedIPDetail}</h2></div>
              <button onClick={() => setIpModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto max-h-[calc(85vh-70px)] p-4">
              {loadingIPDetail ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#F97316]" size={32} /></div>
              ) : ipActivity.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No activity found for this IP</div>
              ) : (
                <div className="space-y-3">
                  {ipActivity.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${log.risk_level === 'critical' ? 'bg-purple-100 text-purple-700' : log.risk_level === 'high' ? 'bg-red-100 text-red-700' : log.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {log.risk_level}
                          </span>
                          <span className="text-sm font-mono">{log.action_type}</span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">Endpoint: {log.endpoint}</p>
                      <p className="text-xs text-gray-400">Status: {log.response_status}</p>
                      {log.user_agent && <p className="text-xs text-gray-400 mt-1 truncate">User Agent: {log.user_agent}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Protection Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-2"><SettingsIcon size={20} className="text-[#F97316]" /><h2 className="text-lg font-semibold">Protection Settings</h2></div>
              <button onClick={() => setSettingsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Failed Login Attempts</label><input type="number" value={protectionSettings.maxFailedAttempts} onChange={(e) => setProtectionSettings({ ...protectionSettings, maxFailedAttempts: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Block Duration (minutes)</label><input type="number" value={protectionSettings.blockDurationMinutes} onChange={(e) => setProtectionSettings({ ...protectionSettings, blockDurationMinutes: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (requests per minute)</label><input type="number" value={protectionSettings.rateLimitPerMinute} onChange={(e) => setProtectionSettings({ ...protectionSettings, rateLimitPerMinute: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">CAPTCHA after attempts</label><input type="number" value={protectionSettings.enableCaptchaAfterAttempts} onChange={(e) => setProtectionSettings({ ...protectionSettings, enableCaptchaAfterAttempts: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="flex items-center justify-between"><label className="text-sm font-medium text-gray-700">Auto-Block Enabled</label><button onClick={() => setProtectionSettings({ ...protectionSettings, autoBlockEnabled: !protectionSettings.autoBlockEnabled })} className={`w-12 h-6 rounded-full transition ${protectionSettings.autoBlockEnabled ? 'bg-[#F97316]' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full transition-transform ${protectionSettings.autoBlockEnabled ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button onClick={() => setSettingsModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveProtectionSettings} disabled={savingSettings} className="px-4 py-2 bg-[#F97316] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{savingSettings ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
