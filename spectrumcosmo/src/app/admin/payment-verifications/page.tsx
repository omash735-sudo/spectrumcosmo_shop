'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, Eye, CheckCircle, XCircle, Clock, Upload, 
  Search, User, Phone, Calendar, 
  CreditCard, Banknote, AlertTriangle, 
  ExternalLink, ArrowUpRight, RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Types
type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface Verification {
  id: number;
  order_id: string;
  proof_image_url: string;
  transaction_reference: string;
  notes: string;
  submitted_at: string;
  status: VerificationStatus;
  rejection_reason?: string;
  customer_name: string;
  phone_number: string;
  total_amount: number | string;
}

interface StatusConfig {
  icon: any;
  badge: string;
  label: string;
  bgGradient: string;
}

const STATUS_CONFIG: Record<VerificationStatus, StatusConfig> = {
  pending: { 
    icon: Clock, 
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    label: 'Pending Review',
    bgGradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20'
  },
  approved: { 
    icon: CheckCircle, 
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    label: 'Approved',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20'
  },
  rejected: { 
    icon: XCircle, 
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
    label: 'Rejected',
    bgGradient: 'from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20'
  },
};

// Helper function to safely parse amount
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
  const router = useRouter();
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch verifications:', errorMessage);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleApprove = async (verificationId: number, orderId: string) => {
    setActionLoading(verificationId);
    try {
      const res = await fetch('/api/admin/payment-verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, orderId, action: 'approve' }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Payment approved successfully');
        fetchVerifications();
      } else {
        toast.error(data.error || 'Failed to approve payment');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Approve error:', errorMessage);
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
        toast.success(data.message || 'Payment rejected');
        fetchVerifications();
      } else {
        toast.error(data.error || 'Failed to reject');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Reject error:', errorMessage);
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
    totalApprovedAmount: verifications
      .filter(v => v.status === 'approved')
      .reduce((sum, v) => sum + parseAmount(v.total_amount), 0),
    totalPendingAmount: verifications
      .filter(v => v.status === 'pending')
      .reduce((sum, v) => sum + parseAmount(v.total_amount), 0),
  };

  const pendingCount = stats.pending;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading payment verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Verifications</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Review and process customer payment proofs
              </p>
            </div>
            <button 
              onClick={() => fetchVerifications()} 
              className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <CreditCard size={20} className="text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">Pending Review</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                <Clock size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 shadow-sm hover:shadow-md transition">
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
          <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 p-4 shadow-sm hover:shadow-md transition">
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
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 p-4 shadow-sm hover:shadow-md transition col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Approved Total</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(stats.totalApprovedAmount)}</p>
                {stats.totalPendingAmount > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    + {formatCurrency(stats.totalPendingAmount)} pending
                  </p>
                )}
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <Banknote size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <button 
                  key={status}
                  onClick={() => setStatusFilter(status)} 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    statusFilter === status 
                      ? status === 'pending' 
                        ? 'bg-amber-500 text-white shadow-md'
                        : status === 'approved'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : status === 'rejected'
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                  {status === 'pending' && pendingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 rounded-full text-xs">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, order, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Pending Verifications Section */}
        {(statusFilter === 'all' || statusFilter === 'pending') && filteredVerifications.filter(v => v.status === 'pending').length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Review</h2>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {filteredVerifications.filter(v => v.status === 'pending').length} items
              </span>
            </div>
            
            <div className="grid gap-5">
              {filteredVerifications.filter(v => v.status === 'pending').map((verification) => {
                const statusConfig = STATUS_CONFIG[verification.status];
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div key={verification.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Proof Image Thumbnail */}
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
                          <button 
                            onClick={() => setSelectedImage(verification.proof_image_url)}
                            className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 mt-2 flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> View full size
                          </button>
                        </div>

                        {/* Verification Details */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.badge}`}>
                                  <StatusIcon size={12} /> {statusConfig.label}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                  Order #{verification.order_id.slice(-8)}
                                </span>
                              </div>
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {verification.customer_name || 'Unknown Customer'}
                              </h3>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {formatCurrency(parseAmount(verification.total_amount))}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Phone size={14} className="text-gray-400" />
                              <span>{verification.phone_number || 'No phone number'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar size={14} className="text-gray-400" />
                              <span>Submitted: {formatDate(verification.submitted_at)}</span>
                            </div>
                            {verification.transaction_reference && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 col-span-full">
                                <CreditCard size={14} className="text-gray-400" />
                                <span className="font-mono">Transaction Ref: {verification.transaction_reference}</span>
                              </div>
                            )}
                          </div>

                          {verification.notes && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Customer note:</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{verification.notes}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                            <button
                              onClick={() => handleApprove(verification.id, verification.order_id)}
                              disabled={actionLoading === verification.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
                            >
                              {actionLoading === verification.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                              Approve Payment
                            </button>
                            <button
                              onClick={() => setShowRejectModal(verification.id)}
                              disabled={actionLoading === verification.id}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
                            >
                              <XCircle size={16} /> Reject
                            </button>
                            <Link
                              href={`/admin/orders/${verification.order_id}`}
                              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2"
                            >
                              View Order Details <ArrowUpRight size={14} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Processed Verifications Section */}
        {(statusFilter === 'all' || statusFilter === 'approved' || statusFilter === 'rejected') && filteredVerifications.filter(v => v.status !== 'pending').length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gray-400 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Processed</h2>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {filteredVerifications.filter(v => v.status !== 'pending').length} items
              </span>
            </div>
            
            <div className="grid gap-3">
              {filteredVerifications.filter(v => v.status !== 'pending').map((verification) => {
                const statusConfig = STATUS_CONFIG[verification.status];
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div key={verification.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          {verification.proof_image_url ? (
                            <img src={verification.proof_image_url} alt="Proof" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <CreditCard size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.badge}`}>
                              <StatusIcon size={10} /> {statusConfig.label}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">#{verification.order_id.slice(-8)}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{verification.customer_name}</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {formatCurrency(parseAmount(verification.total_amount))}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedImage(verification.proof_image_url)}
                          className="p-2 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30"
                          title="View Proof"
                        >
                          <Eye size={16} />
                        </button>
                        <Link
                          href={`/admin/orders/${verification.order_id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          title="View Order"
                        >
                          <ExternalLink size={16} />
                        </Link>
                      </div>
                    </div>
                    {verification.rejection_reason && (
                      <div className="mt-3 p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-xs text-rose-700 dark:text-rose-400">
                        Rejection reason: {verification.rejection_reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredVerifications.length === 0 && (
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
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition p-2"
              aria-label="Close modal"
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
              Please provide a reason for rejecting this payment verification. This will be visible to the customer.
            </p>
            <textarea 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              rows={4} 
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition" 
              placeholder="e.g., Proof image is unclear, Amount does not match order total, Transaction reference invalid..." 
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
              >
                <XCircle size={16} /> Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
