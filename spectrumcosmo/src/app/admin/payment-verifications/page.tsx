'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, Eye, CheckCircle, XCircle, Clock, 
  Search, User, Phone, Calendar, 
  CreditCard, Banknote, AlertTriangle, 
  ExternalLink, RefreshCw, Sparkles,
  Package, Trash2, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface Verification {
  id: number;
  order_id: string;
  order_number: string;
  proof_image_url: string;
  transaction_reference: string;
  notes: string;
  submitted_at: string;
  status: VerificationStatus;
  rejection_reason?: string;
  customer_name: string;
  phone_number: string;
  total_amount: number | string;
  payment_method: string;
}

const STATUS_CONFIG: Record<VerificationStatus, { icon: any; label: string; color: string; bg: string }> = {
  pending: { 
    icon: Clock, 
    label: 'Pending Review',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
  },
  approved: { 
    icon: CheckCircle, 
    label: 'Approved',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
  },
  rejected: { 
    icon: XCircle, 
    label: 'Rejected',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
  },
};

function parseAmount(amount: number | string | null | undefined): number {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PaymentVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-verifications');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVerifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch verifications:', err);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleApprove = async (verificationId: number, orderId: string) => {
    if (!confirm('Approve this payment? The order will be marked as processing.')) return;
    
    setActionLoading(verificationId);
    try {
      const res = await fetch('/api/admin/payment-verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, orderId, action: 'approve' }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Payment approved! Order status updated to processing.');
        await fetchVerifications();
      } else {
        toast.error(data.error || 'Failed to approve payment');
      }
    } catch (err) {
      console.error('Approve error:', err);
      toast.error('Failed to approve payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (verificationId: number, orderId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(verificationId);
    try {
      const res = await fetch('/api/admin/payment-verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, orderId, action: 'reject', rejectionReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowRejectModal(null);
        setRejectionReason('');
        toast.success('Payment rejected. Customer will be notified.');
        await fetchVerifications();
      } else {
        toast.error(data.error || 'Failed to reject');
      }
    } catch (err) {
      console.error('Reject error:', err);
      toast.error('Failed to reject payment');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredVerifications = verifications.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return v.customer_name?.toLowerCase().includes(searchLower) ||
             v.order_id.toLowerCase().includes(searchLower) ||
             v.order_number?.toLowerCase().includes(searchLower) ||
             v.phone_number?.includes(searchTerm) ||
             v.transaction_reference?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const stats = {
    pending: verifications.filter(v => v.status === 'pending').length,
    approved: verifications.filter(v => v.status === 'approved').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
    total: verifications.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Verifications</h1>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Review and process customer payment proofs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${stats.pending > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                {stats.pending} pending
              </span>
              <button 
                onClick={fetchVerifications} 
                className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Banknote size={20} className="text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">Pending</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                <Clock size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Approved</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.approved}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-600 dark:text-rose-400">Rejected</p>
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{stats.rejected}</p>
              </div>
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center">
                <XCircle size={20} className="text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setStatusFilter('all')} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'all' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All ({stats.total})
              </button>
              <button 
                onClick={() => setStatusFilter('pending')} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button 
                onClick={() => setStatusFilter('approved')} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'approved' ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button 
                onClick={() => setStatusFilter('rejected')} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'rejected' ? 'bg-rose-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Rejected ({stats.rejected})
              </button>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Verifications List */}
        {filteredVerifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No verifications found</h3>
            <p className="text-gray-500 dark:text-gray-400">No payment submissions match your current filters.</p>
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              className="mt-4 text-orange-500 hover:text-orange-600 text-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredVerifications.map((verification) => {
              const statusConfig = STATUS_CONFIG[verification.status];
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={verification.id} 
                  className={`bg-white dark:bg-gray-900 rounded-xl border ${statusConfig.bg} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Proof Image */}
                      <div className="lg:w-48 flex-shrink-0">
                        <div 
                          onClick={() => setSelectedImage(verification.proof_image_url)}
                          className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
                        >
                          {verification.proof_image_url ? (
                            <img 
                              src={verification.proof_image_url} 
                              alt="Payment proof" 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <CreditCard size={32} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Eye size={24} className="text-white" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                          <Clock size={12} /> Submitted {formatDate(verification.submitted_at)}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                <StatusIcon size={12} /> {statusConfig.label}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                Order #{verification.order_number || verification.order_id.slice(-8)}
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                              {verification.customer_name || 'Unknown Customer'}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1"><Phone size={14} /> {verification.phone_number || 'N/A'}</span>
                              <span className="flex items-center gap-1"><CreditCard size={14} /> {verification.payment_method || 'Manual'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {formatCurrency(parseAmount(verification.total_amount))}
                            </p>
                            {verification.transaction_reference && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">
                                Ref: {verification.transaction_reference}
                              </p>
                            )}
                          </div>
                        </div>

                        {verification.notes && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Customer note:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{verification.notes}</p>
                          </div>
                        )}

                        {verification.rejection_reason && (
                          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-800">
                            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Rejection reason:</p>
                            <p className="text-sm text-rose-700 dark:text-rose-400">{verification.rejection_reason}</p>
                          </div>
                        )}

                        {/* Actions */}
                        {verification.status === 'pending' && (
                          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                              onClick={() => handleApprove(verification.id, verification.order_id)}
                              disabled={actionLoading === verification.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
                            >
                              {actionLoading === verification.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                              Approve Payment
                            </button>
                            <button
                              onClick={() => setShowRejectModal(verification.id)}
                              disabled={actionLoading === verification.id}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
                            >
                              <XCircle size={16} /> Reject
                            </button>
                            <Link
                              href={`/admin/orders/${verification.order_id}`}
                              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2"
                            >
                              <Package size={16} /> View Order
                            </Link>
                          </div>
                        )}

                        {verification.status !== 'pending' && (
                          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <Link
                              href={`/admin/orders/${verification.order_id}`}
                              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2"
                            >
                              <Package size={16} /> View Order
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition p-2"
            >
              <XCircle size={28} />
            </button>
            <img 
              src={selectedImage} 
              alt="Payment proof" 
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-black" 
            />
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950/50 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reject Payment</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Provide a reason for rejecting this payment. The customer will see this reason.
            </p>
            <textarea 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              rows={4} 
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition" 
              placeholder="e.g., Proof image is unclear, Amount does not match order total..." 
              autoFocus 
            />
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowRejectModal(null); setRejectionReason(''); }} 
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const verification = verifications.find(v => v.id === showRejectModal);
                  if (verification) handleReject(verification.id, verification.order_id);
                }} 
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2 transition flex items-center justify-center gap-2"
                disabled={actionLoading === showRejectModal}
              >
                {actionLoading === showRejectModal ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
