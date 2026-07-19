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
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

// ===== SKELETON =====
function SecurityOverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="h-10 bg-[var(--background-secondary)] rounded w-24" />
      </div>
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 bg-[var(--background-secondary)] rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-[var(--background-secondary)] rounded w-48" />
            <div className="h-4 bg-[var(--background-secondary)] rounded w-64" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--background-secondary)] rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-80 bg-[var(--background-secondary)] rounded-xl" />
        <div className="h-80 bg-[var(--background-secondary)] rounded-xl" />
      </div>
    </div>
  );
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
      toast.error('Failed to load security data');
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
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <SecurityOverviewSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--foreground)]">Security Overview</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5 sm:mt-1">Monitor suspicious activity and protect your store</p>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition text-xs sm:text-sm min-h-[40px] disabled:opacity-50"
          >
            <RefreshCw size={14} className={`sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>

        {/* Security Status Card */}
        <div className={`bg-[var(--background-card)] rounded-xl border p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm ${
          status.color === 'green' ? 'border-green-200 dark:border-green-800/50' :
          status.color === 'yellow' ? 'border-yellow-200 dark:border-yellow-800/50' :
          status.color === 'orange' ? 'border-orange-200 dark:border-orange-800/50' :
          'border-red-200 dark:border-red-800/50'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
              status.color === 'green' ? 'bg-green-100 dark:bg-green-950/30' :
              status.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-950/30' :
              status.color === 'orange' ? 'bg-orange-100 dark:bg-orange-950/30' :
              'bg-red-100 dark:bg-red-950/30'
            }`}>
              {status.color === 'green' ? (
                <CheckCircle size={28} className="sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
              ) : status.color === 'yellow' ? (
                <AlertTriangle size={28} className="sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <AlertTriangle size={28} className="sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--foreground)]">
                Security Status: <span className={
                  status.color === 'green' ? 'text-emerald-600 dark:text-emerald-400' :
                  status.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                  status.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }>{status.label}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-[var(--foreground-muted)]">
                <span className="flex items-center gap-1">
                  <CheckCircle size={12} className={summary?.twofa_enabled ? 'text-emerald-500' : 'text-[var(--border)]'} />
                  {summary?.twofa_enabled ? '2FA Enabled' : '2FA Disabled'}
                </span>
                <span className="flex items-center gap-1">
                  {summary?.active_threats === 0 ? (
                    <CheckCircle size={12} className="text-emerald-500" />
                  ) : (
                    <AlertTriangle size={12} className="text-[var(--primary)]" />
                  )}
                  {summary?.active_threats === 0 ? 'No active threats' : `${summary?.active_threats} active threats`}
                </span>
                <span className="flex items-center gap-1">
                  <Shield size={12} className="text-emerald-500" />
                  Protection enabled
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-[var(--foreground-muted)]" />
                  Last scan: {summary?.last_scan || 'Just now'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">Security Score</span>
              <div className="relative w-24 sm:w-32 h-2.5 sm:h-3 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                    summary?.security_score && summary.security_score >= 90 ? 'bg-emerald-500' :
                    summary?.security_score && summary.security_score >= 70 ? 'bg-yellow-500' :
                    summary?.security_score && summary.security_score >= 50 ? 'bg-[var(--primary)]' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${summary?.security_score || 0}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[var(--foreground)] min-w-[36px]">{summary?.security_score || 0}%</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Events</p>
                <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{summary?.total_events || 0}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--background-secondary)] rounded-full flex items-center justify-center">
                <Activity size={14} className="sm:w-[18px] sm:h-[18px] text-[var(--foreground-muted)]" />
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Blocked IPs</p>
                <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">{summary?.blocked_ips || 0}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center">
                <Ban size={14} className="sm:w-[18px] sm:h-[18px] text-red-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Failed Logins</p>
                <p className="text-lg sm:text-xl font-bold text-[var(--primary)]">{summary?.failed_logins || 0}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 dark:bg-orange-950/30 rounded-full flex items-center justify-center">
                <AlertTriangle size={14} className="sm:w-[18px] sm:h-[18px] text-[var(--primary)]" />
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Suspicious IPs</p>
                <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">{summary?.suspicious_ips || 0}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 dark:bg-purple-950/30 rounded-full flex items-center justify-center">
                <Users size={14} className="sm:w-[18px] sm:h-[18px] text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Activity */}
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-[var(--foreground-muted)]" />
                  <h2 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">Recent Activity</h2>
                </div>
                <Link 
                  href="/admin/security/logs" 
                  className="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-[var(--border)] max-h-[280px] sm:max-h-80 overflow-y-auto">
              {logs.slice(0, 10).map((log) => (
                <div key={log.id} className="px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-[var(--background-secondary)] transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                        log.risk_level === 'critical' ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400' :
                        log.risk_level === 'high' ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' :
                        log.risk_level === 'medium' ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                      }`}>
                        {log.risk_level}
                      </span>
                      <span className="text-xs sm:text-sm text-[var(--foreground)]">{log.action_type}</span>
                      <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)] font-mono">{log.ip_address}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={20} className="text-[var(--foreground-muted)] sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)]">No recent activity</p>
                  <p className="text-xs text-[var(--foreground-muted)] opacity-70 mt-1">All systems quiet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recently Blocked IPs */}
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ban size={16} className="text-red-500" />
                  <h2 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">Recently Blocked IPs</h2>
                </div>
                <Link 
                  href="/admin/security/blocked" 
                  className="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-[var(--border)] max-h-[280px] sm:max-h-80 overflow-y-auto">
              {blockedIPs.map((ip) => (
                <div key={ip.id} className="px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-[var(--background-secondary)] transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <div>
                      <p className="font-mono text-xs sm:text-sm text-[var(--foreground)]">{ip.ip_address}</p>
                      <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">{ip.reason}</p>
                    </div>
                    <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                      <Clock size={10} className="sm:w-3 sm:h-3" />
                      Expires: {new Date(ip.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {blockedIPs.length === 0 && (
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield size={20} className="text-[var(--foreground-muted)] sm:w-6 sm:h-6" />
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)]">No blocked IPs</p>
                  <p className="text-xs text-[var(--foreground-muted)] opacity-70 mt-1">All clear</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
