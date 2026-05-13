'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Upload, AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft, FileText } from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';

type PaymentData = {
  order: {
    id: string;
    customer_name: string;
    total_amount: number;
    payment_status: string;
    payment_method: string;
  };
  provider: {
    name: string;
    type: string;
    category: string;
    account_name: string;
    account_number: string;
    branch: string;
    instructions: string;
  } | null;
  existing_proof: string | null;
  existing_note: string | null;
  confirmations: any[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Awaiting Payment', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  awaiting_verification: { label: 'Verification in Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  paid: { label: 'Payment Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function OrderPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/payment`);
        if (!res.ok) throw new Error('Failed to load payment data');
        const data = await res.json();
        setPaymentData(data);
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    };
    if (orderId) loadPaymentData();
  }, [orderId]);

  const uploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setMessage({ type: 'error', text: 'Cloudinary configuration missing.' });
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', proofFile);
    formData.append('upload_preset', uploadPreset);

    try {
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url) throw new Error('Upload failed');

      const confirmRes = await fetch(`/api/orders/${orderId}/payment-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofImageUrl: uploadData.secure_url,
          transactionReference: transactionRef,
          notes: note,
        }),
      });

      if (!confirmRes.ok) throw new Error('Failed to save proof');

      setMessage({ type: 'success', text: 'Payment proof submitted! Admin will review it shortly.' });
      setProofFile(null);
      setTransactionRef('');
      setNote('');
      
      const refreshed = await fetch(`/api/orders/${orderId}/payment`);
      const newData = await refreshed.json();
      setPaymentData(newData);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </main>
        <Footer />
      </>
    );
  }

  if (!paymentData) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen p-6 text-center">
          <p>Payment data not available.</p>
        </main>
        <Footer />
      </>
    );
  }

  const { order, provider, existing_proof, existing_note } = paymentData;
  const statusConfig = STATUS_CONFIG[order.payment_status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const isAwaiting = order.payment_status === 'awaiting_verification';
  const isPaid = order.payment_status === 'paid';
  const canUpload = !isPaid && !isAwaiting;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* Status Header */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold">Payment for Order #{order.id.slice(-8)}</h1>
                <p className="text-gray-500 mt-1">Amount: MWK {order.total_amount.toLocaleString()}</p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.color}`}>
                <StatusIcon size={18} />
                <span className="font-medium">{statusConfig.label}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions (only for manual payments that are not yet paid) */}
          {provider && !isPaid && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 mb-6">
              <h2 className="font-semibold text-amber-800 flex items-center gap-2 mb-4">
                <AlertCircle size={20} /> Payment Instructions
              </h2>
              <div className="space-y-3 text-sm">
                <p><strong>Provider:</strong> {provider.name}</p>
                {provider.category === 'mobile_money' && (
                  <p><strong>Mobile Money Number:</strong> {provider.account_number}</p>
                )}
                {provider.category === 'bank' && (
                  <>
                    <p><strong>Bank:</strong> {provider.name}</p>
                    <p><strong>Account Name:</strong> {provider.account_name}</p>
                    <p><strong>Account Number:</strong> {provider.account_number}</p>
                    {provider.branch && <p><strong>Branch:</strong> {provider.branch}</p>}
                  </>
                )}
                {provider.instructions && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="font-medium">Instructions:</p>
                    <div className="text-gray-600 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: provider.instructions }} />
                  </div>
                )}
                <p className="text-amber-700 mt-2 font-medium">
                  Amount to pay: MWK {order.total_amount.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Upload Proof Section - Only when payment is pending */}
          {canUpload && provider && (
            <div className="bg-white rounded-2xl border p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">Upload Payment Proof</h2>
              <form onSubmit={uploadProof} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Screenshot / Receipt *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    required
                    className="w-full text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Upload a clear screenshot of your payment confirmation.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Transaction Reference (optional)</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full border rounded-xl p-2 text-sm"
                    placeholder="e.g., TRX-123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Additional Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border rounded-xl p-2 text-sm"
                    placeholder="Any extra information..."
                  />
                </div>
                {message && (
                  <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={uploading || !proofFile}
                  className="w-full bg-orange-600 text-white py-2.5 rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="animate-spin inline mr-2" size={16} /> : <Upload size={16} className="inline mr-2" />}
                  {uploading ? 'Submitting...' : 'Submit Payment Proof'}
                </button>
              </form>
            </div>
          )}

          {/* Existing Proof Display */}
          {existing_proof && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-3">Submitted Proof</h2>
              <a href={existing_proof} target="_blank" rel="noopener noreferrer" className="text-orange-600 underline break-all">
                View uploaded proof image
              </a>
              {existing_note && <p className="text-sm text-gray-500 mt-2">Note: {existing_note}</p>}
              {isAwaiting && (
                <p className="text-sm text-blue-600 mt-3">Your payment is being reviewed by our team. We'll notify you once verified.</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => router.push('/account/orders')}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              View My Orders
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              Continue Shopping
            </button>
          </div>

          {/* Invoice Download Button - Only shown when payment is confirmed (paid) */}
          {isPaid && (
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="font-semibold text-gray-800 mb-3">Invoice</h2>
              <p className="text-sm text-gray-500 mb-4">Download your invoice for this order.</p>
              <a
                href={`/api/orders/${orderId}/invoice`}
                download
                className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                <FileText size={16} /> Download Invoice
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
