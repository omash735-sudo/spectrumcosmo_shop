// app/admin/subscribers/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Users, Mail, Calendar, Search, Filter, Download, 
  Loader2, CheckCircle, XCircle, Clock, Eye, MoreVertical,
  ChevronLeft, ChevronRight, ArrowUpDown, UserCheck, UserX,
  FileText, FileSpreadsheet, FileDown, Trash2, RefreshCw,
  AlertCircle
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

// ===== SKELETON =====
function SubscribersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-[var(--background-secondary)] rounded w-20" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-[var(--background-secondary)] rounded-xl" />
        ))}
      </div>
      <div className="h-12 bg-[var(--background-secondary)] rounded-xl" />
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--background-secondary)] rounded w-1/3" />
                <div className="h-3 bg-[var(--background-secondary)] rounded w-1/4" />
              </div>
              <div className="h-6 bg-[var(--background-secondary)] rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/subscribers');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSubscribers(data);
    } catch (error) {
      setError('Failed to load subscribers');
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
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <SubscribersSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Subscribers</h1>
              </div>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
                Manage your newsletter subscribers and their preferences
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExport('pdf')}
                disabled={!!exporting}
                className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-1.5 sm:gap-2 transition disabled:opacity-50 text-xs sm:text-sm min-h-[40px]"
              >
                {exporting === 'pdf' ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                <span className="hidden xs:inline">PDF</span>
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={!!exporting}
                className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-1.5 sm:gap-2 transition disabled:opacity-50 text-xs sm:text-sm min-h-[40px]"
              >
                {exporting === 'excel' ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
                <span className="hidden xs:inline">Excel</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={!!exporting}
                className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 sm:gap-2 transition disabled:opacity-50 text-xs sm:text-sm min-h-[40px]"
              >
                {exporting === 'csv' ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
                <span className="hidden xs:inline">CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4 sm:mb-6">
            <div className="flex flex-wrap items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">Error: {error}</span>
              <button 
                onClick={fetchSubscribers} 
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total</p>
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-500">Subscribed</p>
            <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-400">{stats.confirmed}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-500">Pending</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Unsubscribed</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-700 dark:text-gray-400">{stats.unsubscribed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" size={16} />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {['confirmed', 'pending', 'unsubscribed'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    const newStatus = filters.status.includes(status)
                      ? filters.status.filter(s => s !== status)
                      : [...filters.status, status];
                    setFilters({ ...filters, status: newStatus });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition min-h-[36px] ${
                    filters.status.includes(status)
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subscribers Table */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
          {paginatedSubscribers.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="sm:w-7 sm:h-7 text-[var(--foreground-muted)] opacity-50" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-1">No subscribers found</h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                {filters.search || filters.status.length > 0 
                  ? 'Try adjusting your search or filters.'
                  : 'Start building your newsletter audience.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-[var(--background-secondary)] border-b border-[var(--border)]">
                  <tr>
                    {[
                      { key: 'email', label: 'Email' },
                      { key: 'name', label: 'Name' },
                      { key: 'status', label: 'Status' },
                      { key: 'created_at', label: 'Subscribed' },
                      { key: 'preferences', label: 'Preferences' },
                    ].map(column => (
                      <th key={column.key} className="px-3 sm:px-4 py-2 sm:py-3 text-left">
                        <button
                          onClick={() => {
                            if (sortBy === column.key) {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy(column.key as any);
                              setSortOrder('desc');
                            }
                          }}
                          className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider hover:text-[var(--foreground)] transition"
                        >
                          {column.label}
                          <ArrowUpDown size={12} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {paginatedSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-[var(--background-secondary)] transition">
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <p className="text-xs sm:text-sm font-medium text-[var(--foreground)] truncate max-w-[150px] sm:max-w-[250px]">
                          {subscriber.email}
                        </p>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                          {subscriber.name || '-'}
                        </p>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        {getStatusBadge(subscriber.status)}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                          {format(new Date(subscriber.created_at), 'MMM d, yyyy')}
                        </p>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        {subscriber.preferences && Object.keys(subscriber.preferences).length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-[10px] sm:text-xs">
                            <CheckCircle size={10} className="sm:w-3 sm:h-3" />
                            Set
                          </span>
                        ) : (
                          <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && paginatedSubscribers.length > 0 && (
            <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 border border-[var(--border)] rounded-lg text-sm bg-[var(--background-card)] text-[var(--foreground)] min-h-[36px]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">per page</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--background-secondary)] transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <ChevronLeft size={16} className="text-[var(--foreground-muted)]" />
                </button>
                <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--background-secondary)] transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <ChevronRight size={16} className="text-[var(--foreground-muted)]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {paginatedSubscribers.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
              Showing {paginatedSubscribers.length} of {filteredSubscribers.length} subscribers
            </p>
            {filteredSubscribers.length !== subscribers.length && (
              <button
                onClick={() => {
                  setFilters({ status: [], search: '', dateRange: 'all', hasPreferences: false });
                  setCurrentPage(1);
                }}
                className="text-[10px] sm:text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
