'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  Server,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react';

interface ApiLog {
  id: number;
  endpoint: string;
  method: string;
  status: number;
  response_time_ms: number;
  started_at: string;
  ip_address: string;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');

  const fetchLogs = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard/api-logs?limit=50');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (statusFilter === 'success' && log.status >= 400) return false;
    if (statusFilter === 'error' && log.status < 400) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return log.endpoint.toLowerCase().includes(query) ||
             log.ip_address.includes(query) ||
             log.method.toLowerCase().includes(query);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity size={24} className="text-[var(--primary)]" />
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Activity Logs</h1>
                <span className="bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">
                  {logs.length} events
                </span>
              </div>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                Real-time API request history and system activity
              </p>
            </div>
            <button 
              onClick={fetchLogs} 
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Search by endpoint, IP, or method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'all' 
                    ? 'bg-[var(--primary)] text-white' 
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('success')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'success' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                }`}
              >
                <CheckCircle size={14} className="inline mr-1" />
                Success
              </button>
              <button
                onClick={() => setStatusFilter('error')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'error' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                }`}
              >
                <XCircle size={14} className="inline mr-1" />
                Errors
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--background-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Endpoint</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Response</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[var(--foreground-muted)]">
                      <Server size={32} className="mx-auto mb-3 opacity-30" />
                      <p>No API activity found</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--background-secondary)] transition">
                      <td className="px-4 py-3 text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                        {new Date(log.started_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.method === 'GET' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' :
                          log.method === 'POST' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' :
                          log.method === 'PUT' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' :
                          'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground)] font-mono text-xs truncate max-w-[200px]">
                        {log.endpoint}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.status >= 200 && log.status < 300 
                            ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                            : log.status >= 400 
                              ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400' 
                              : 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground-muted)] text-xs">
                        {log.response_time_ms}ms
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground-muted)] font-mono text-xs">
                        {log.ip_address}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
