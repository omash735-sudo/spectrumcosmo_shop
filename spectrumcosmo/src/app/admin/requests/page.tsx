'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Loader2, Eye, CheckCircle, XCircle, Clock, RefreshCw, 
  TrendingUp, Users, Package, Filter, ChevronDown, 
  Calendar, MessageSquare, Heart, Image as ImageIcon,
  AlertCircle, Search, Sparkles, ArrowRight
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
  pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-50', icon: Clock },
  reviewing: { label: 'Reviewing', color: 'text-blue-700', bg: 'bg-blue-50', icon: AlertCircle },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle },
  sourcing: { label: 'Sourcing', color: 'text-purple-700', bg: 'bg-purple-50', icon: Package },
  available: { label: 'Available', color: 'text-teal-700', bg: 'bg-teal-50', icon: TrendingUp },
};

const statuses = ['pending', 'reviewing', 'approved', 'rejected', 'sourcing', 'available'];

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-7 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Product Requests</h1>
              <Sparkles size={18} className="text-orange-400" />
            </div>
            <p className="text-gray-500 text-sm">Review and manage community product submissions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Requests</p>
            </div>
            <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              <p className="text-xs text-yellow-600">Pending Review</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
              <p className="text-xs text-green-600">Approved</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              <p className="text-xs text-red-600">Rejected</p>
            </div>
            <div className="bg-orange-50 rounded-xl border border-orange-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-orange-700">{stats.totalLikes}</p>
              <p className="text-xs text-orange-600">Total Votes</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => {
                  const isActive = filter === s;
                  const count = s === 'pending' ? stats.pending : 
                               s === 'approved' ? stats.approved : 
                               s === 'rejected' ? stats.rejected : 0;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                      {count > 0 && isActive && (
                        <span className="ml-1.5 bg-white/20 text-inherit text-xs px-1.5 py-0.5 rounded-full">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, user, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">Error: {error}</span>
                <button onClick={fetchRequests} className="ml-auto text-red-600 hover:text-red-700 text-sm underline">
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Requests Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No {filter} requests</h3>
                <p className="text-gray-500 text-sm">
                  {filter === 'pending' 
                    ? 'When users submit requests, they will appear here.'
                    : `No ${filter} requests found.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Request</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Images</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Likes</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequests.map((req) => {
                      const status = statusConfig[req.status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <tr key={req.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 line-clamp-1">{req.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{req.description}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-800">{req.user_name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-400">{req.user_email}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{req.category_name || '—'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <ImageIcon size={14} /> {req.image_count || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <Heart size={14} className="text-red-400" /> {req.like_count || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                              <StatusIcon size={12} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(req.created_at)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="p-2 text-gray-400 hover:text-orange-600 transition rounded-lg hover:bg-orange-50"
                            >
                              <Eye size={18} />
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
            <div className="mt-4 text-right text-xs text-gray-400">
              Showing {filteredRequests.length} of {requests.length} requests
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Review Request</h2>
              <button onClick={() => setSelectedRequest(null)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">User</label>
                  <p className="font-medium text-gray-900 mt-1">{selectedRequest.user_name || 'Anonymous'}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.user_email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</label>
                  <p className="text-gray-900 mt-1">{formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Title</label>
                <p className="font-medium text-gray-900 mt-1">{selectedRequest.title}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</label>
                  <p className="text-gray-900 mt-1">{selectedRequest.category_name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-1">
                    <Heart size={16} className="text-red-400" /> {selectedRequest.like_count}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Admin Notes</label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Add internal notes about this request..."
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'approved')}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Approve
                </button>
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'rejected')}
                  disabled={processing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle size={18} /> Reject
                </button>
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'reviewing')}
                  disabled={processing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Clock size={18} /> Start Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Missing X icon import
import { X } from 'lucide-react';
