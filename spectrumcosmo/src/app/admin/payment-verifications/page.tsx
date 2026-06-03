// app/admin/payment-verifications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, Eye, CheckCircle, XCircle, Clock, Upload, 
  Search, Filter, ChevronDown, User, Phone, Calendar, 
  DollarSign, CreditCard, Banknote, AlertTriangle, 
  Shield, ExternalLink, Image as ImageIcon, Zap, ArrowUpRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Verification = {
  id: number;
  order_id: string;
  proof_image_url: string;
  transaction_reference: string;
  notes: string;
  submitted_at: string;
  status: string;
  rejection_reason?: string;
  customer_name: string;
  phone_number: string;
  total_amount: number;
};

export default function PaymentVerificationsPage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-verifications');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVerifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

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
      toast.error('Failed to reject payment');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          icon: Clock, 
          bg: 'bg-amber-50', 
          text: 'text-amber-700', 
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-700',
          label: 'Pending Review'
        };
      case 'approved':
        return { 
          icon: CheckCircle, 
          bg: 'bg-emerald-50', 
          text: 'text-emerald-700', 
          border: 'border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-700',
          label: 'Approved'
        };
      case 'rejected':
        return { 
          icon: XCircle, 
          bg: 'bg-rose-50', 
          text: 'text-rose-700', 
          border: 'border-rose-200',
          badge: 'bg-rose-100 text-rose-700',
          label: 'Rejected'
        };
      default:
        return { 
          icon: Clock, 
          bg: 'bg-gray-50', 
          text: 'text-gray-700', 
          border: 'border-gray-200',
          badge: 'bg-gray-100 text-gray-700',
          label: status
        };
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
    totalAmount: verifications.reduce((sum, v) => sum + (v.total_amount || 0), 0),
  };

  const pendingCount = stats.pending;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-500">Loading payment verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payment Verifications</h1>
              <p className="text-gray-500 mt-1">Review and process customer payment proofs</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => window.location.reload()} 
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition shadow-sm"
                >
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <CreditCard size={20} className="text-gray-500" />
              </div>
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Pending Review</p>
                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600">Approved</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.approved}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-rose-50 rounded-xl border border-rose-200 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-600">Rejected</p>
                <p className="text-2xl font-bold text-rose-700">{stats.rejected}</p>
              </div>
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <XCircle size={20} className="text-rose-600" />
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Value</p>
                <p className="text-2xl font-bold text-blue-700">MWK {stats.totalAmount.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Banknote size={20} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setStatusFilter('all')} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'all' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All
              </button>
              <button 
                onClick={() => setStatusFilter('pending')} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Pending {pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-200 rounded-full text-xs">{pendingCount}</span>}
              </button>
              <button 
                onClick={() => setStatusFilter('approved')} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'approved' ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Approved
              </button>
              <button 
                onClick={() => setStatusFilter('rejected')} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'rejected' ? 'bg-rose-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Rejected
              </button>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, order, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Pending Verifications Section */}
        {statusFilter === 'all' || statusFilter === 'pending' ? (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Pending Review</h2>
              <span className="text-sm text-gray-400">{filteredVerifications.filter(v => v.status === 'pending').length} items</span>
            </div>
            
            {filteredVerifications.filter(v => v.status === 'pending').length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h3>
                <p className="text-gray-500">No pending payment verifications to review.</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {filteredVerifications.filter(v => v.status === 'pending').map((verification) => {
                  const statusConfig = getStatusConfig(verification.status);
                  
                  return (
                    <div key={verification.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          
                          {/* Proof Image Thumbnail */}
                          <div className="lg:w-48 flex-shrink-0">
                            <div 
                              onClick={() => setSelectedImage(verification.proof_image_url)}
                              className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                            >
                              <img 
                                src={verification.proof_image_url} 
                                alt="Payment proof" 
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <Eye size={24} className="text-white" />
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedImage(verification.proof_image_url)}
                              className="text-xs text-orange-600 hover:text-orange-700 mt-2 flex items-center gap-1"
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
                                    <statusConfig.icon size={12} /> {statusConfig.label}
                                  </span>
                                  <span className="text-xs text-gray-400 font-mono">Order #{verification.order_id.slice(-8)}</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">{verification.customer_name || 'Unknown Customer'}</h3>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-orange-600">MWK {verification.total_amount?.toLocaleString() || '0'}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Phone size={14} className="text-gray-400" />
                                <span>{verification.phone_number || 'No phone number'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar size={14} className="text-gray-400" />
                                <span>Submitted: {new Date(verification.submitted_at).toLocaleString()}</span>
                              </div>
                              {verification.transaction_reference && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 col-span-full">
                                  <CreditCard size={14} className="text-gray-400" />
                                  <span className="font-mono">Transaction Ref: {verification.transaction_reference}</span>
                                </div>
                              )}
                            </div>

                            {verification.notes && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <p className="text-xs text-gray-500 mb-1">Customer note:</p>
                                <p className="text-sm text-gray-700">{verification.notes}</p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100 pt-4">
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
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
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
            )}
          </div>
        ) : null}

        {/* Processed Verifications Section */}
        {(statusFilter === 'all' || statusFilter === 'approved' || statusFilter === 'rejected') && filteredVerifications.filter(v => v.status !== 'pending').length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gray-400 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Processed</h2>
              <span className="text-sm text-gray-400">{filteredVerifications.filter(v => v.status !== 'pending').length} items</span>
            </div>
            
            <div className="grid gap-3">
              {filteredVerifications.filter(v => v.status !== 'pending').map((verification) => {
                const statusConfig = getStatusConfig(verification.status);
                
                return (
                  <div key={verification.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={verification.proof_image_url} alt="Proof" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.badge}`}>
                              <statusConfig.icon size={10} /> {statusConfig.label}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">#{verification.order_id.slice(-8)}</span>
                            <span className="text-sm font-medium text-gray-900">{verification.customer_name}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">MWK {verification.total_amount?.toLocaleString() || '0'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedImage(verification.proof_image_url)}
                          className="p-2 text-gray-400 hover:text-orange-600 transition rounded-lg hover:bg-orange-50"
                          title="View Proof"
                        >
                          <Eye size={16} />
                        </button>
                        <Link
                          href={`/admin/orders/${verification.order_id}/receipt`}
                          className="p-2 text-gray-400 hover:text-emerald-600 transition rounded-lg hover:bg-emerald-50"
                          title="Upload Receipt"
                        >
                          <Upload size={16} />
                        </Link>
                        <Link
                          href={`/admin/orders/${verification.order_id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition rounded-lg hover:bg-blue-50"
                          title="View Order"
                        >
                          <ExternalLink size={16} />
                        </Link>
                      </div>
                    </div>
                    {verification.rejection_reason && (
                      <div className="mt-3 p-2 bg-rose-50 rounded-lg text-xs text-rose-700">
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
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No verifications found</h3>
            <p className="text-gray-500">No payment submissions match your current filters.</p>
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Reject Payment</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this payment verification. This will be visible to the customer.</p>
            <textarea 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              rows={4} 
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition" 
              placeholder="e.g., Proof image is unclear, Amount does not match order total, Transaction reference invalid..." 
              autoFocus 
            />
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowRejectModal(null); setRejectionReason(''); }} 
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition"
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

// Helper component for refresh icon (add this or import from lucide-react)
function RefreshCw(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  );
}
