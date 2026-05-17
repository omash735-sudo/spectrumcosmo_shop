'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Upload, AlertCircle, Trash2, CheckCircle, Clock } from 'lucide-react';
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
    status: string;
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
};

export default function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cancellingProof, setCancellingProof] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setMessage({ type: 'error', text: 'No order specified. Please return to checkout.' });
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/payment`);
        if (!res.ok) throw new Error('Failed to load payment data');
        const data = await res.json();
        setPaymentData(data);
      } catch (err: any) {
        console.error('Load error:', err);
        setMessage({ type: 'error', text: err.message || 'Failed to load payment data. Please contact support.' });
      } finally {
        setLoading(false);
      }
    };
    load();
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
      setMessage({ type: 'error', text: 'Upload service not configured. Please contact support.' });
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', proofFile);
    formData.append('upload_preset', uploadPreset);

    try {
      console.log('Uploading to Cloudinary...');
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url) throw new Error('Upload failed');

      console.log('Cloudinary success, URL:', uploadData.secure_url);
      console.log('Calling API:', `/api/orders/${orderId}/payment-confirm`);

      const confirmRes = await fetch(`/api/orders/${orderId}/payment-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofImageUrl: uploadData.secure_url,
          transactionReference: transactionRef,
          notes: note,
        }),
      });

      console.log('API Response Status:', confirmRes.status);
      const result = await confirmRes.json();
      console.log('API Response Body:', result);

      if (!confirmRes.ok) throw new Error(result.error || 'Failed to save proof');

      setMessage({ type: 'success', text: 'Payment proof submitted! Admin will review it shortly.' });
      setProofFile(null);
      setTransactionRef('');
      setNote('');
      
      // Refresh payment data
      const refreshed = await fetch(`/api/orders/${orderId}/payment`);
      const newData = await refreshed.json();
      setPaymentData(newData);
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const cancelProof = async () => {
    if (!confirm('Are you sure you want to remove your submitted proof? You will need to upload a new one.')) return;
    setCancellingProof(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payment-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const refreshed = await fetch(`/api/orders/${orderId}/payment`);
        const newData = await refreshed.json();
        setPaymentData(newData);
        setMessage({ type: 'success', text: 'Proof removed. You can upload a new one.' });
      } else {
        throw new Error('Failed to remove proof');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCancellingProof(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
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
          <div className="max-w-md mx-auto bg-white rounded-xl p-6 shadow-sm">
            <AlertCircle className="text-red-500 w-12 h-12 mx-auto mb-3" />
            <p className="text-gray-700">Payment data not available.</p>
            <p className="text-xs text-gray-500 mt-2 break-all">Order ID: {orderId || 'missing'}</p>
            <button
              onClick={() => router.push('/account/orders')}
              className="mt-4 text-orange-600 hover:underline"
            >
              Go to My Orders
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { order, provider, existing_proof, existing_note } = paymentData;
  const isPaid = order.payment_status === 'paid';
  const isAwaiting = order.payment_status === 'awaiting_verification';
  const isCancelled = order.status === 'cancelled';
  const canUpload = !isPaid && !isAwaiting && !isCancelled;

  if (isCancelled) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 py-10">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
              <div className="text-red-500 text-5xl mb-4">✕</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Cancelled</h1>
              <p className="text-gray-500 mb-6">This order has been cancelled. No further action is required.</p>
              <button
                onClick={() => router.push('/account/orders')}
                className="bg-orange-500 text-white px-6 py-2 rounded-xl"
              >
                View My Orders
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4">
          {/* Status Header */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold">Payment for Order #{order.id.slice(-8)}</h1>
                <p className="text-gray-500 mt-1">Amount: MWK {order.total_amount.toLocaleString()}</p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                isPaid ? 'bg-green-100 text-green-700' : 
                isAwaiting ? 'bg-blue-100 text-blue-700' : 
                'bg-yellow-100 text-yellow-700'
              }`}>
                {isPaid ? <CheckCircle size={16} /> : isAwaiting ? <Clock size={16} /> : <Clock size={16} />}
                <span>{isPaid ? 'Payment Confirmed' : isAwaiting ? 'Awaiting Verification' : 'Payment Pending'}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          {provider && !isPaid && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 mb-6">
              <h2 className="font-semibold text-amber-800 flex items-center gap-2 mb-4">
                <AlertCircle size={20} /> Payment Instructions
              </h2>
              <div className="space-y-3 text-sm">
                <p><strong>Provider:</strong> {provider.name}</p>
                {provider.category === 'mobile_money' && (
                  <p><strong>Mobile Money Number:</strong> <span className="font-mono bg-white px-2 py-1 rounded">{provider.account_number}</span></p>
                )}
                {provider.category === 'bank' && (
                  <>
                    <p><strong>Bank:</strong> {provider.name}</p>
                    <p><strong>Account Name:</strong> {provider.account_name}</p>
                    <p><strong>Account Number:</strong> <span className="font-mono bg-white px-2 py-1 rounded">{provider.account_number}</span></p>
                    {provider.branch && <p><strong>Branch:</strong> {provider.branch}</p>}
                  </>
                )}
                {provider.instructions && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="font-medium">Instructions:</p>
                    <div className="text-gray-600 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: provider.instructions }} />
                  </div>
                )}
                <p className="text-amber-700 mt-2 font-medium text-base">
                  Amount to pay: <strong>MWK {order.total_amount.toLocaleString()}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Upload Proof Section */}
          {canUpload && (
            <div className="bg-white rounded-2xl border p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">Upload Payment Proof</h2>
              <p className="text-sm text-gray-500 mb-4">After making the payment, take a screenshot or save the receipt and upload it here.</p>
              <form onSubmit={uploadProof} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Screenshot / Receipt *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    required
                    className="w-full text-sm border rounded-lg p-2"
                  />
                  <p className="text-xs text-gray-400 mt-1">Accepted formats: JPG, PNG. Max size: 5MB.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Transaction Reference (optional)</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full border rounded-xl p-2 text-sm"
                    placeholder="e.g., TRX-123456, Reference number from your bank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Additional Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border rounded-xl p-2 text-sm"
                    placeholder="Any extra information about your payment..."
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

          {/* Existing Proof Display with Cancel Option */}
          {existing_proof && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-3">Submitted Proof</h2>
              <a href={existing_proof} target="_blank" rel="noopener noreferrer" className="text-orange-600 underline break-all">
                View uploaded proof image
              </a>
              {existing_note && <p className="text-sm text-gray-500 mt-2">Note: {existing_note}</p>}
              {isAwaiting && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">Your payment is being reviewed by our team. We will notify you once verified.</p>
                </div>
              )}
              {canUpload && existing_proof && !isAwaiting && (
                <button
                  onClick={cancelProof}
                  disabled={cancellingProof}
                  className="mt-3 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
                >
                  <Trash2 size={14} />
                  {cancellingProof ? 'Removing...' : 'Cancel and remove this proof'}
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
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
        </div>
      </main>
      <Footer />
    </>
  );
}
