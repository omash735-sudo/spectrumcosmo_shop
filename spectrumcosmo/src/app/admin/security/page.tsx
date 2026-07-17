'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  Ban,
  RefreshCw,
  Search,
  Eye,
  Users,
  Clock,
  Lock,
  Unlock,
  Server,
  Database,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface SecurityLog {
  id: number;
  action_type: string;
  endpoint: string;
  ip_address: string;
  risk_level: string;
  blocked: boolean;
  created_at: string;
}

interface BlockedIP {
  id: number;
  ip_address: string;
  reason: string;
  expires_at: string;
}

interface SecuritySummary {
  total_events: number;
  blocked_ips: number;
  failed_logins: number;
  suspicious_ips: number;
  security_score: number;
  last_scan: string;
  twofa_enabled: boolean;
  active_threats: number;
}

export default function SecurityOverview() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [summaryRes, logsRes, blockedRes] = await Promise.all([
        fetch('/api/admin/security/summary'),
        fetch('/api/admin/security/logs?limit=20'),
        fetch('/api/admin/security/blocked-ips?limit=5'),
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      if (blockedRes.ok) setBlockedIPs(await blockedRes.json());
    } catch (err) {
      console.error('Failed to fetch security data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getSecurityStatus = () => {
    if (!summary) return { label: 'Loading', color: 'gray' };
    if (summary.security_score >= 90) return { label: 'Excellent', color: 'green' };
    if (summary.security_score >= 70) return { label: 'Good', color: 'yellow' };
    if (summary.security_score >= 50) return { label: 'Fair', color: 'orange' };
    return { label: 'Needs Attention', color: 'red' };
  };

  const status = getSecurityStatus();

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
          <div className="bg-white rounded-xl border p-6 h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Shield size={32} className="text-[#F97316]" />
              <h1 className="text-3xl font-bold text-gray-900">Security Overview</h1>
            </div>
            <p className="text-gray-500 mt-1">Monitor suspicious activity and protect your store</p>
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

        {/* Security Status Card */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                status.color === 'green' ? 'bg-green-100' :
                status.color === 'yellow' ? 'bg-yellow-100' :
                status.color === 'orange' ? 'bg-orange-100' :
                'bg-red-100'
              }`}>
                {status.color === 'green' ? (
                  <CheckCircle size={32} className="text-green-600" />
                ) : status.color === 'yellow' ? (
                  <AlertTriangle size={32} className="text-yellow-600" />
                ) : (
                  <AlertTriangle size={32} className="text-red-600" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Security Status: {status.label}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle size={14} className={summary?.twofa_enabled ? 'text-green-500' : 'text-gray-300'} />
                    {summary?.twofa_enabled ? '2FA Enabled' : '2FA Disabled'}
                  </span>
                  <span className="flex items-center gap-1">
                    {summary?.active_threats === 0 ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <AlertTriangle size={14} className="text-orange-500" />
                    )}
                    {summary?.active_threats === 0 ? 'No active threats' : `${summary?.active_threats} active threats`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield size={14} className="text-green-500" />
                    Protection enabled
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} className="text-gray-400" />
                    Last scan: {summary?.last_scan || 'Just now'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Security Score</span>
              <div className="relative w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full ${
                    summary?.security_score && summary.security_score >= 90 ? 'bg-green-500' :
                    summary?.security_score && summary.security_score >= 70 ? 'bg-yellow-500' :
                    summary?.security_score && summary.security_score >= 50 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${summary?.security_score || 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 min-w-[40px]">{summary?.security_score || 0}%</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <Activity size={20} className="text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary?.total_events || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total Events</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <Ban size={20} className="text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{summary?.blocked_ips || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Blocked IPs</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle size={20} className="text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{summary?.failed_logins || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Failed Logins</p>
          </div>
          
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-2">
              <Users size={20} className="text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{summary?.suspicious_ips || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Suspicious IPs</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={20} className="text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <Link 
                  href="/admin/security/logs" 
                  className="text-sm text-[#F97316] hover:underline"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="divide-y max-h-80 overflow-y-auto">
              {logs.slice(0, 10).map((log) => (
                <div key={log.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.risk_level === 'critical' ? 'bg-purple-100 text-purple-700' :
                        log.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                        log.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {log.risk_level}
                      </span>
                      <span className="text-sm text-gray-700">{log.action_type}</span>
                      <span className="text-xs text-gray-400">{log.ip_address}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Recently Blocked IPs */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ban size={20} className="text-red-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Recently Blocked IPs</h2>
                </div>
                <Link 
                  href="/admin/security/blocked" 
                  className="text-sm text-[#F97316] hover:underline"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="divide-y max-h-80 overflow-y-auto">
              {blockedIPs.map((ip) => (
                <div key={ip.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm">{ip.ip_address}</p>
                      <p className="text-xs text-gray-500">{ip.reason}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      Expires: {new Date(ip.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {blockedIPs.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                  <p>No blocked IPs</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
