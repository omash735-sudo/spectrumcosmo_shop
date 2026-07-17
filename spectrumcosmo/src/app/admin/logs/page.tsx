'use client';

import { useEffect, useState } from 'react';
import {
  Eye,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  Download,
  Ban,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

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
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
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
      }
    } catch (err) {
      console.error('Failed to export logs:', err);
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
    const blob = new Blob([csv], { type: 'text/csv' });
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

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mb-8"></div>
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
              <Eye size={32} className="text-[#F97316]" />
              <h1 className="text-3xl font-bold text-gray-900">Security Logs</h1>
            </div>
            <p className="text-gray-500 mt-1">Complete audit trail of all security events</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search IP, action, endpoint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
            </div>
            
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]"
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
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              <option value="all">All Status</option>
              <option value="true">Blocked</option>
              <option value="false">Allowed</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </button>

            <span className="text-sm text-gray-400 ml-auto">
              {totalItems} events found
            </span>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">IP Address</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Endpoint</th>
                  <th className="px-4 py-3 text-left">Risk</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{log.ip_address}</td>
                    <td className="px-4 py-3 text-xs">{log.action_type}</td>
                    <td className="px-4 py-3 text-xs truncate max-w-[200px]">{log.endpoint}</td>
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
                    <td className="px-4 py-3">
                      {log.blocked ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          Blocked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          Allowed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <CheckCircle size={32} className="mx-auto mb-2 text-gray-300" />
                      <p>No security logs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
