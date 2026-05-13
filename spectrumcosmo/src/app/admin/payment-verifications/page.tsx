'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Image from 'next/image';

type Verification = {
  id: number;
  order_id: string;
  proof_image_url: string;
  transaction_reference: string;
  notes: string;
  submitted_at: string;
  status: string;
  customer_name: string;
  phone_number: string;
  total_amount: number;
  rejection_reason?: string;
};

export default function PaymentVerificationsPage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-verifications');
      const data = await res.json();
      setVerifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleApprove = async (verificationId: number, orderId: string) => {
    setActionLoading(`${verificationId}-approve`);
    try {
      const res = await fetch(`/api/admin/payment-verifications/${verificationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        fetchVerifications();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to approve');
      }
    } catch (err) {
      alert('Failed to approve payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (verificationId: number, orderId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setActionLoading(`${verificationId}-reject`);
    try {
      const res = await fetch(`/api/admin/payment-verifications/${verificationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason: rejectionReason }),
      });
      if (res.ok) {
        setShowRejectModal(null);
        setRejectionReason('');
        fetchVerifications();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reject');
      }
    } catch (err) {
      alert('Failed to reject payment');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full"><Clock size={12} /> Pending</span>;
      case 'approved':
        return <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"><CheckCircle size={12} /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="pt-16 lg:pt-0">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      </div>
    );
  }

  const pendingVerifications = verifications.filter(v => v.status === 'pending');
  const processedVerifications = verifications.filter(v => v.status !== 'pending');

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payment Verifications</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and approve manual payment submissions
        </p>
      </div>

      {/* Pending Verifications */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Pending ({pendingVerifications.length})</h2>
        {pendingVerifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            No pending verifications
          </div>
        ) : (
          <div className="space-y-4">
            {pendingVerifications.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{v.order_id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">{v.customer_name}</p>
                    <p className="text-sm text-gray-500">{v.phone_number}</p>
                    <p className="text-lg font-bold text-orange-600 mt-1">MWK {v.total_amount.toLocaleString()}</p>
                    {v.transaction_reference && (
                      <p className="text-xs text-gray-400 mt-1">Reference: {v.transaction_reference}</p>
                    )}
                    {v.notes && <p className="text-xs text-gray-500 mt-1">Note: {v.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => setSelectedImage(v.proof_image_url)}
                      className="flex items-center gap-1 text-orange-600 hover:text-orange-800 text-sm"
                    >
                      <Eye size={16} /> View Proof
                    </button>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApprove(v.id, v.order_id)}
                        disabled={!!actionLoading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                      >
                        {actionLoading === `${v.id}-approve` ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectModal(v.id.toString())}
                        disabled={!!actionLoading}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Verifications */}
      {processedVerifications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Processed</h2>
          <div className="space-y-3">
            {processedVerifications.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <p className="font-medium text-gray-900">Order #{v.order_id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">{v.customer_name}</p>
                    <p className="text-sm font-medium text-gray-700">MWK {v.total_amount.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(v.status)}
                    <button
                      onClick={() => setSelectedImage(v.proof_image_url)}
                      className="text-gray-400 hover:text-orange-600"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
                {v.rejection_reason && (
                  <p className="text-xs text-red-500 mt-2">Reason: {v.rejection_reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700">
              <XCircle size={20} />
            </button>
            <Image src={selectedImage} alt="Payment proof" width={800} height={600} className="object-contain w-full h-auto" />
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Reject Payment</h3>
            <p className="text-sm text-gray-600 mb-3">Please provide a reason for rejection:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full border rounded-xl p-2 text-sm"
              placeholder="e.g., Proof image unclear, amount mismatch..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const verification = verifications.find(v => v.id.toString() === showRejectModal);
                  if (verification) handleReject(verification.id, verification.order_id);
                }}
                className="flex-1 bg-red-600 text-white rounded-xl py-2"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
