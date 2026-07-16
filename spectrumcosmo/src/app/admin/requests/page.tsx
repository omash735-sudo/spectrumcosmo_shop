'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Loader2, Eye, CheckCircle, XCircle, Clock, RefreshCw, 
  TrendingUp, Users, Package, Filter, ChevronDown, 
  Calendar, MessageSquare, Heart, Image as ImageIcon,
  AlertCircle, Search, Sparkles, ArrowRight, X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Request {
  id: string;
  title: string;
  description: string;
  category_name: string;
  category_id: number | null;
  status: string;
  user_name: string;
  user_email: string;
  like_count: number;
  image_count: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30', icon: Clock },
  reviewing: { label: 'Reviewing', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: AlertCircle },
  approved: { label: 'Approved', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', icon: XCircle },
  sourcing: { label: 'Sourcing', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', icon: Package },
  available: { label: 'Available', color: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30', icon: TrendingUp },
};

const statuses = ['pending', 'reviewing', 'approved', 'rejected', 'sourcing', 'available'];

// ===== SKELETON =====
function RequestsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-[var(--background-secondary)] rounded-xl" />
        ))}
      </div>
      <div className="h-12 bg-[var(--background-secondary)] rounded-xl" />
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-[var(--background-secondary)] rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getStatusIcon(status: string) {
  const config = statusConfig[status];
  const Icon = config?.icon || Clock;
  return <Icon size={14} className={config?.color} />;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/requests?status=${filter}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (id: string, newStatus: string) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, admin_notes: adminNote }),
      });
      if (!res.ok) throw new Error('Update failed');
      setSelectedRequest(null);
      setAdminNote('');
      await fetchRequests();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return req.title.toLowerCase().includes(term) ||
           req.user_name.toLowerCase().includes(term) ||
           req.user_email.toLowerCase().includes(term) ||
           req.description.toLowerCase().includes(term);
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalLikes: requests.reduce((sum, r) => sum + (r.like_count || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <RequestsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Product Requests</h1>
            </div>
            <Sparkles size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--primary)]" />
          </div>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">Review and manage community product submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Requests</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
            <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-500">Pending Review</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-400">{stats.approved}</p>
            <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-500">Approved</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800 p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-400">{stats.rejected}</p>
            <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-500">Rejected</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800 p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-[var(--primary)]">{stats.totalLikes}</p>
            <p className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-500">Total Votes</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {statuses.map((s) => {
                const isActive = filter === s;
                const count = s === 'pending' ? stats.pending : 
                             s === 'approved' ? stats.approved : 
                             s === 'rejected' ? stats.rejected : 0;
                const status = statusConfig[s];
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 min-h-[36px] ${
                      isActive 
                        ? 'bg-[var(--primary)] text-white shadow-sm' 
                        : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                    }`}
                  >
                    {status.label}
                    {count > 0 && (
                      <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[var(--background)] text-[var(--foreground-muted)]'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="relative w-full sm:w-56 md:w-64">
              <Search size={14} className="sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Search by title, user, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-9 pr-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4 sm:mb-6">
            <div className="flex flex-wrap items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">Error: {error}</span>
              <button 
                onClick={fetchRequests} 
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Requests Table */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={24} className="sm:w-8 sm:h-8 text-[var(--foreground-muted)] opacity-50" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-1">
                No {filter} requests
              </h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                {filter === 'pending' 
                  ? 'When users submit requests, they will appear here.'
                  : `No ${filter} requests found.`}
              </p>
              {filter !== 'pending' && (
                <button
                  onClick={() => setFilter('pending')}
                  className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium"
                >
                  View pending requests
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-[var(--background-secondary)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Request</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider hidden sm:table-cell">User</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider hidden md:table-cell">Category</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider hidden lg:table-cell">Images</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Likes</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider hidden xl:table-cell">Date</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredRequests.map((req) => {
                    const status = statusConfig[req.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    return (
                      <tr key={req.id} className="hover:bg-[var(--background-secondary)] transition">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <p className="font-medium text-sm text-[var(--foreground)] line-clamp-1">{req.title}</p>
                          <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5 line-clamp-1 sm:line-clamp-2 max-w-[150px] sm:max-w-[200px]">
                            {req.description}
                          </p>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                          <p className="text-xs sm:text-sm font-medium text-[var(--foreground)] truncate max-w-[100px] sm:max-w-[120px]">
                            {req.user_name || 'Anonymous'}
                          </p>
                          <p className="text-[10px] text-[var(--foreground-muted)] truncate max-w-[100px] sm:max-w-[120px]">
                            {req.user_email}
                          </p>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--foreground-muted)] hidden md:table-cell">
                          {req.category_name || '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                            <ImageIcon size={14} /> {req.image_count || 0}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                            <Heart size={14} className="text-red-400" /> {req.like_count || 0}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${status.bg} ${status.color}`}>
                            <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs text-[var(--foreground-muted)] hidden xl:table-cell">
                          {formatDate(req.created_at)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="p-1.5 sm:p-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 min-h-[32px] min-w-[32px] flex items-center justify-center"
                          >
                            <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Page Info */}
        {filteredRequests.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
              Showing {filteredRequests.length} of {requests.length} requests
            </p>
            {filter !== 'pending' && (
              <button
                onClick={() => setFilter('pending')}
                className="text-[10px] sm:text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
              >
                View pending requests
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-[var(--background-card)] rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[85vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[var(--background-card)] flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
                </div>
                <h2 className="text-base sm:text-xl font-bold text-[var(--foreground)]">Review Request</h2>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X size={18} className="text-[var(--foreground-muted)]" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[calc(95vh-70px)] sm:max-h-[calc(85vh-70px)]">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">User</label>
                  <p className="font-medium text-[var(--foreground)] text-sm sm:text-base mt-1">{selectedRequest.user_name || 'Anonymous'}</p>
                  <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">{selectedRequest.user_email}</p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Submitted</label>
                  <p className="text-[var(--foreground)] text-sm sm:text-base mt-1">{formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Title</label>
                <p className="font-medium text-[var(--foreground)] text-sm sm:text-base mt-1">{selectedRequest.title}</p>
              </div>

              <div>
                <label className="text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Description</label>
                <p className="text-[var(--foreground-muted)] text-sm mt-1 whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Category</label>
                  <p className="text-[var(--foreground)] text-sm mt-1">{selectedRequest.category_name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Likes</label>
                  <p className="text-[var(--foreground)] text-sm mt-1 flex items-center gap-1">
                    <Heart size={14} className="sm:w-4 sm:h-4 text-red-400" /> {selectedRequest.like_count}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5 block">Admin Notes</label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none"
                  placeholder="Add internal notes about this request..."
                />
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'approved')}
                  disabled={processing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 sm:py-2.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm min-h-[44px]"
                >
                  <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> Approve
                </button>
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'rejected')}
                  disabled={processing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 sm:py-2.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm min-h-[44px]"
                >
                  <XCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> Reject
                </button>
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'reviewing')}
                  disabled={processing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-2.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm min-h-[44px]"
                >
                  <Clock size={16} className="sm:w-[18px] sm:h-[18px]" /> Start Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
