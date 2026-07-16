'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, Eye, CheckCircle, XCircle, Clock, 
  Search, User, Phone, Calendar, 
  CreditCard, Banknote, AlertTriangle, 
  ExternalLink, RefreshCw, Sparkles,
  Package, Trash2, ChevronDown, X
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

// ===== SKELETON =====
function VerificationsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-[var(--background-secondary)] rounded w-24" />
          <div className="h-10 bg-[var(--background-secondary)] rounded w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--background-secondary)] rounded-xl" />
        ))}
      </div>
      <div className="h-12 bg-[var(--background-secondary)] rounded-xl" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="sm:w-48 h-32 bg-[var(--background-secondary)] rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-[var(--background-secondary)] rounded w-1/3" />
                <div className="h-4 bg-[var(--background-secondary)] rounded w-1/2" />
                <div className="h-10 bg-[var(--background-secondary)] rounded w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        toast.success('Payment approved! Order status updated to processing.');
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
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1400px] mx-auto">
          <VerificationsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Payment Verifications</h1>
              </div>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
                Review and process customer payment proofs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                stats.pending > 0 
                  ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' 
                  : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
              }`}>
                {stats.pending} pending
              </span>
              <button 
                onClick={fetchVerifications} 
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] transition min-h-[40px] text-sm"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span className="hidden xs:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--background-secondary)] rounded-full flex items-center justify-center">
                <Banknote size={16} className="sm:w-5 sm:h-5 text-[var(--foreground-muted)]" />
              </div>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.pending}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                <Clock size={16} className="sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">Approved</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.approved}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                <CheckCircle size={16} className="sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-rose-600 dark:text-rose-400">Rejected</p>
                <p className="text-lg sm:text-2xl font-bold text-rose-700 dark:text-rose-400">{stats.rejected}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center">
                <XCircle size={16} className="sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button 
                onClick={() => setStatusFilter('all')} 
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition min-h-[36px] ${
                  statusFilter === 'all' ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                }`}
              >
                All ({stats.total})
              </button>
              <button 
                onClick={() => setStatusFilter('pending')} 
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition min-h-[36px] ${
                  statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button 
                onClick={() => setStatusFilter('approved')} 
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition min-h-[36px] ${
                  statusFilter === 'approved' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button 
                onClick={() => setStatusFilter('rejected')} 
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition min-h-[36px] ${
                  statusFilter === 'rejected' ? 'bg-rose-500 text-white shadow-sm' : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                }`}
              >
                Rejected ({stats.rejected})
              </button>
            </div>
            <div className="relative w-full sm:w-56 md:w-64">
              <Search size={14} className="sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Search by customer, order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-9 pr-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Verifications List */}
        {filteredVerifications.length === 0 ? (
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="sm:w-8 sm:h-8 text-[var(--foreground-muted)] opacity-50" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-1">No verifications found</h3>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">No payment submissions match your current filters.</p>
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredVerifications.map((verification) => {
              const statusConfig = STATUS_CONFIG[verification.status];
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={verification.id} 
                  className={`bg-[var(--background-card)] rounded-xl border ${statusConfig.bg} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                      {/* Proof Image */}
                      <div className="lg:w-40 xl:w-48 flex-shrink-0">
                        <div 
                          onClick={() => setSelectedImage(verification.proof_image_url)}
                          className="relative aspect-video bg-[var(--background-secondary)] rounded-lg overflow-hidden cursor-pointer group"
                        >
                          {verification.proof_image_url ? (
                            <img 
                              src={verification.proof_image_url} 
                              alt="Payment proof" 
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <CreditCard size={24} className="sm:w-8 sm:h-8 text-[var(--foreground-muted)] opacity-30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Eye size={18} className="sm:w-6 sm:h-6 text-white" />
                          </div>
                        </div>
                        <p className="text-[10px] text-[var(--foreground-muted)] mt-1.5 flex items-center gap-1">
                          <Clock size={10} className="sm:w-3 sm:h-3" /> Submitted {formatDate(verification.submitted_at)}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                <StatusIcon size={10} className="sm:w-3 sm:h-3" /> {statusConfig.label}
                              </span>
                              <span className="text-[10px] text-[var(--foreground-muted)] font-mono">
                                Order #{verification.order_number || verification.order_id.slice(-8)}
                              </span>
                            </div>
                            <h3 className="text-base sm:text-xl font-semibold text-[var(--foreground)] mt-1 truncate">
                              {verification.customer_name || 'Unknown Customer'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-0.5 text-xs sm:text-sm text-[var(--foreground-muted)]">
                              <span className="flex items-center gap-0.5 sm:gap-1"><Phone size={12} className="sm:w-3.5 sm:h-3.5" /> {verification.phone_number || 'N/A'}</span>
                              <span className="flex items-center gap-0.5 sm:gap-1"><CreditCard size={12} className="sm:w-3.5 sm:h-3.5" /> {verification.payment_method || 'Manual'}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg sm:text-2xl font-bold text-[var(--primary)]">
                              {formatCurrency(parseAmount(verification.total_amount))}
                            </p>
                            {verification.transaction_reference && (
                              <p className="text-[10px] text-[var(--foreground-muted)] font-mono mt-0.5 truncate max-w-[120px] sm:max-w-[200px]">
                                Ref: {verification.transaction_reference}
                              </p>
                            )}
                          </div>
                        </div>

                        {verification.notes && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)]">
                            <p className="text-[10px] text-[var(--foreground-muted)]">Customer note:</p>
                            <p className="text-xs sm:text-sm text-[var(--foreground)]">{verification.notes}</p>
                          </div>
                        )}

                        {verification.rejection_reason && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-800">
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Rejection reason:</p>
                            <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-400">{verification.rejection_reason}</p>
                          </div>
                        )}

                        {/* Actions */}
                        {verification.status === 'pending' && (
                          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border)]">
                            <button
                              onClick={() => handleApprove(verification.id, verification.order_id)}
                              disabled={actionLoading === verification.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition disabled:opacity-50 shadow-sm min-h-[36px] sm:min-h-[40px]"
                            >
                              {actionLoading === verification.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} className="sm:w-4 sm:h-4" />}
                              Approve
                            </button>
                            <button
                              onClick={() => setShowRejectModal(verification.id)}
                              disabled={actionLoading === verification.id}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition disabled:opacity-50 shadow-sm min-h-[36px] sm:min-h-[40px]"
                            >
                              <XCircle size={14} className="sm:w-4 sm:h-4" /> Reject
                            </button>
                            <Link
                              href={`/admin/orders/${verification.order_id}`}
                              className="px-3 sm:px-4 py-1.5 sm:py-2 border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] transition flex items-center gap-1.5 sm:gap-2 min-h-[36px] sm:min-h-[40px]"
                            >
                              <Package size={14} className="sm:w-4 sm:h-4" /> View Order
                            </Link>
                          </div>
                        )}

                        {verification.status !== 'pending' && (
                          <div className="flex flex-wrap gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border)]">
                            <Link
                              href={`/admin/orders/${verification.order_id}`}
                              className="px-3 sm:px-4 py-1.5 sm:py-2 border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] transition flex items-center gap-1.5 sm:gap-2 min-h-[36px] sm:min-h-[40px]"
                            >
                              <Package size={14} className="sm:w-4 sm:h-4" /> View Order
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
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute -top-10 sm:-top-12 right-0 text-white hover:text-gray-300 transition p-2"
            >
              <X size={24} className="sm:w-7 sm:h-7" />
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--background-card)] rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-rose-100 dark:bg-rose-950/50 rounded-full flex items-center justify-center">
                <AlertTriangle size={16} className="sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold text-[var(--foreground)]">Reject Payment</h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mb-3 sm:mb-4">
              Provide a reason for rejecting this payment. The customer will see this reason.
            </p>
            <textarea 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              rows={4} 
              className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none" 
              placeholder="e.g., Proof image is unclear, Amount does not match order total..." 
              autoFocus 
            />
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button 
                onClick={() => { setShowRejectModal(null); setRejectionReason(''); }} 
                className="flex-1 px-4 py-2 border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px] text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const verification = verifications.find(v => v.id === showRejectModal);
                  if (verification) handleReject(verification.id, verification.order_id);
                }} 
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2 transition flex items-center justify-center gap-2 min-h-[44px] text-sm"
                disabled={actionLoading === showRejectModal}
              >
                {actionLoading === showRejectModal ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} className="sm:w-4 sm:h-4" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
