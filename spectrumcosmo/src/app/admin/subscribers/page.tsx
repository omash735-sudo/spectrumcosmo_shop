// app/admin/subscribers/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Users, Mail, Calendar, Search, Filter, Download, 
  Loader2, CheckCircle, XCircle, Clock, Eye, MoreVertical,
  ChevronLeft, ChevronRight, ArrowUpDown, UserCheck, UserX,
  FileText, FileSpreadsheet, FileDown, Trash2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Subscriber {
  id: number;
  email: string;
  name: string;
  status: 'pending' | 'confirmed' | 'unsubscribed';
  preferences: any;
  confirmed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
}

interface FilterState {
  status: string[];
  search: string;
  dateRange: 'all' | 'week' | 'month' | 'year';
  hasPreferences: boolean;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    search: '',
    dateRange: 'all',
    hasPreferences: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<'email' | 'name' | 'created_at' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscribers');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSubscribers(data);
    } catch (error) {
      toast.error('Failed to load subscribers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const filteredSubscribers = useMemo(() => {
    let filtered = [...subscribers];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.email.toLowerCase().includes(search) ||
        s.name?.toLowerCase().includes(search)
      );
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(s => filters.status.includes(s.status));
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (filters.dateRange === 'week') cutoff.setDate(now.getDate() - 7);
      if (filters.dateRange === 'month') cutoff.setMonth(now.getMonth() - 1);
      if (filters.dateRange === 'year') cutoff.setFullYear(now.getFullYear() - 1);
      filtered = filtered.filter(s => new Date(s.created_at) >= cutoff);
    }

    if (filters.hasPreferences) {
      filtered = filtered.filter(s => s.preferences && Object.keys(s.preferences).length > 0);
    }

    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [subscribers, filters, sortBy, sortOrder]);

  const paginatedSubscribers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubscribers.slice(start, start + itemsPerPage);
  }, [filteredSubscribers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);

  const stats = useMemo(() => {
    const total = subscribers.length;
    const confirmed = subscribers.filter(s => s.status === 'confirmed').length;
    const pending = subscribers.filter(s => s.status === 'pending').length;
    const unsubscribed = subscribers.filter(s => s.status === 'unsubscribed').length;
    return { total, confirmed, pending, unsubscribed };
  }, [subscribers]);

  const handleExport = async (exportType: 'pdf' | 'excel' | 'csv') => {
    setExporting(exportType);
    try {
      const res = await fetch('/api/admin/subscribers/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          format: exportType,
          filters,
          sortBy,
          sortOrder,
          subscriberIds: filteredSubscribers.map(s => s.id),
        }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileExtension = exportType === 'pdf' ? 'pdf' : exportType === 'excel' ? 'xlsx' : 'csv';
      link.download = `subscribers_${format(new Date(), 'yyyy-MM-dd')}.${fileExtension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${filteredSubscribers.length} subscribers as ${exportType.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
      console.error(error);
    } finally {
      setExporting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      confirmed: { label: 'Subscribed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
      unsubscribed: { label: 'Unsubscribed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
    };
    const c = config[status as keyof typeof config] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.color}`}>
        <Icon size={12} />
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-10 h-10 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading subscribers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="w-7 h-7 text-orange-500" />
                Subscribers
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your newsletter subscribers and their preferences
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleExport('pdf')}
                disabled={!!exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-xl flex items-center gap-2 hover:bg-red-700 transition disabled:opacity-50"
              >
                {exporting === 'pdf' ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={!!exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2 hover:bg-green-700 transition disabled:opacity-50"
              >
                {exporting === 'excel' ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
                Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={!!exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
              >
                {exporting === 'csv' ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Subscribed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Unsubscribed</p>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.unsubscribed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['confirmed', 'pending', 'unsubscribed'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    const newStatus = filters.status.includes(status)
                      ? filters.status.filter(s => s !== status)
                      : [...filters.status, status];
                    setFilters({ ...filters, status: newStatus });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    filters.status.includes(status)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {[
                    { key: 'email', label: 'Email' },
                    { key: 'name', label: 'Name' },
                    { key: 'status', label: 'Status' },
                    { key: 'created_at', label: 'Subscribed' },
                    { key: 'preferences', label: 'Preferences' },
                  ].map(column => (
                    <th key={column.key} className="px-4 py-3 text-left">
                      <button
                        onClick={() => {
                          if (sortBy === column.key) {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy(column.key as any);
                            setSortOrder('desc');
                          }
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700"
                      >
                        {column.label}
                        <ArrowUpDown size={12} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{subscriber.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{subscriber.name || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(subscriber.status)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(subscriber.created_at), 'MMM d, yyyy')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {subscriber.preferences && Object.keys(subscriber.preferences).length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs">
                          <CheckCircle size={12} />
                          Set
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-500">per page</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
