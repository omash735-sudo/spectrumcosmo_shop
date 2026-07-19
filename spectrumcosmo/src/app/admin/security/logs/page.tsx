'use client';

import { useEffect, useState } from 'react';
import {
  Eye,
  Search,
  RefreshCw,
  Download,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SecurityLog {
  id: number;
  action_type: string;
  endpoint: string;
  ip_address: string;
  risk_level: string;
  blocked: boolean;
  user_id: number | null;
  user_agent: string | null;
  created_at: string;
}

// ===== SKELETON =====
function SecurityLogsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-[var(--background-secondary)] rounded w-24" />
          <div className="h-10 bg-[var(--background-secondary)] rounded w-20" />
        </div>
      </div>
      <div className="h-12 bg-[var(--background-secondary)] rounded-xl" />
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--background-secondary)] rounded w-1/4" />
                <div className="h-3 bg-[var(--background-secondary)] rounded w-1/3" />
              </div>
              <div className="h-6 bg-[var(--background-secondary)] rounded w-16" />
              <div className="h-8 w-8 bg-[var(--background-secondary)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [blockedFilter, setBlockedFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 50;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery,
        risk: riskFilter,
        blocked: blockedFilter,
      });
      const res = await fetch(`/api/admin/security/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      } else {
        toast.error('Failed to load security logs');
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      toast.error('Failed to load security logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, searchQuery, riskFilter, blockedFilter]);

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        export: 'true',
        search: searchQuery,
        risk: riskFilter,
        blocked: blockedFilter,
      });
      const res = await fetch(`/api/admin/security/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        const csv = convertToCSV(data);
        downloadCSV(csv, `security-logs-${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Logs exported successfully');
      } else {
        toast.error('Failed to export logs');
      }
    } catch (err) {
      console.error('Failed to export logs:', err);
      toast.error('Failed to export logs');
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return 'No data';
    const headers = ['Time', 'IP', 'Action', 'Endpoint', 'Risk', 'Blocked'];
    const rows = data.map(item => [
      new Date(item.created_at).toLocaleString(),
      item.ip_address,
      item.action_type,
      item.endpoint,
      item.risk_level,
      item.blocked ? 'Yes' : 'No',
    ]);
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRiskFilter('all');
    setBlockedFilter('all');
    setPage(1);
  };

  const getRiskBadge = (risk: string) => {
    const config = {
      critical: { bg: 'bg-purple-100 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400' },
      high: { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' },
      medium: { bg: 'bg-yellow-100 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-400' },
      low: { bg: 'bg-green-100 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400' },
    };
    const c = config[risk as keyof typeof config] || config.low;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {risk}
      </span>
    );
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <SecurityLogsSkeleton />
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
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--foreground)]">Security Logs</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5 sm:mt-1">Complete audit trail of all security events</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportLogs}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition text-xs sm:text-sm min-h-[40px]"
            >
              <Download size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Export CSV</span>
            </button>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition text-xs sm:text-sm min-h-[40px] disabled:opacity-50"
            >
              <RefreshCw size={14} className={`sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Events</p>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{totalItems}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800 p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400">Critical</p>
            <p className="text-lg sm:text-xl font-bold text-purple-700 dark:text-purple-400">
              {logs.filter(l => l.risk_level === 'critical').length}
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800 p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400">High Risk</p>
            <p className="text-lg sm:text-xl font-bold text-red-700 dark:text-red-400">
              {logs.filter(l => l.risk_level === 'high').length}
            </p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">Blocked</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {logs.filter(l => l.blocked).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-[160px] sm:min-w-[200px] w-full sm:w-auto">
              <div className="relative">
                <Search size={14} className="sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  placeholder="Search IP, action, endpoint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 sm:pl-9 pr-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px]"
                />
              </div>
            </div>
            
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 sm:px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] min-h-[40px]"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={blockedFilter}
              onChange={(e) => setBlockedFilter(e.target.value)}
              className="px-2.5 sm:px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] min-h-[40px]"
            >
              <option value="all">All Status</option>
              <option value="true">Blocked</option>
              <option value="false">Allowed</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-3 py-2 text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition min-h-[40px]"
            >
              Clear Filters
            </button>

            <span className="text-xs sm:text-sm text-[var(--foreground-muted)] ml-auto">
              {totalItems} events found
            </span>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-[var(--background-secondary)] border-b border-[var(--border)] sticky top-0">
                <tr className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase tracking-wider">
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Time</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">IP Address</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Action</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell">Endpoint</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Risk</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden lg:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--background-secondary)] transition">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-mono text-[10px] sm:text-xs text-[var(--foreground)] hidden sm:table-cell">
                      {log.ip_address}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-[var(--foreground)]">
                      {log.action_type}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-[var(--foreground-muted)] truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] hidden md:table-cell">
                      {log.endpoint}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      {getRiskBadge(log.risk_level)}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                      {log.blocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                          <Ban size={10} className="sm:w-3 sm:h-3" /> Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400">
                          <CheckCircle size={10} className="sm:w-3 sm:h-3" /> Allowed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield size={20} className="text-[var(--foreground-muted)] sm:w-6 sm:h-6" />
                      </div>
                      <p className="text-sm text-[var(--foreground-muted)]">No security logs found</p>
                      <p className="text-xs text-[var(--foreground-muted)] opacity-70 mt-1">All clear</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <ChevronLeft size={14} className="sm:w-4 sm:h-4 text-[var(--foreground-muted)]" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <ChevronRight size={14} className="sm:w-4 sm:h-4 text-[var(--foreground-muted)]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
