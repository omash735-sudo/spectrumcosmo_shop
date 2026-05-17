'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Upload, AlertCircle, Trash2, CheckCircle, Clock, Phone, Landmark, ReceiptText, FileText, ArrowRight } from 'lucide-react';
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
      setMessage({ type: 'error', text: 'No order specified.' });
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
        setMessage({ type: 'error', text: err.message });
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
      setMessage({ type: 'error', text: 'Upload service not configured.' });
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

      const confirmRes = await fetch('/api/account/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          proofOfPaymentUrl: uploadData.secure_url,
          paymentNote: note,
          transactionReference: transactionRef,
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
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const cancelProof = async () => {
    if (!confirm('Remove your submitted proof?')) return;
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
        setMessage({ type: 'success', text: 'Proof removed.' });
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
            <button onClick={() => router.push('/account/orders')} className="mt-4 text-orange-600">
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
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Cancelled</h1>
              <p className="text-gray-500 mb-6">This order has been cancelled.</p>
              <button onClick={() => router.push('/account/orders')} className="bg-orange-500 text-white px-6 py-2 rounded-xl">
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
        <div className="max-w-2xl mx-auto px-4">
          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment for Order #{order.id.slice(-8)}</h1>
                <p className="text-gray-500 mt-1 text-lg">Amount: MWK {order.total_amount ? order.total_amount.toLocaleString() : '0'}</p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                isPaid ? 'bg-green-100 text-green-700' : 
                isAwaiting ? 'bg-blue-100 text-blue-700' : 
                'bg-yellow-100 text-yellow-700'
              }`}>
                {isPaid ? <CheckCircle size={16} /> : <Clock size={16} />}
                <span>{isPaid ? 'Payment Confirmed' : isAwaiting ? 'Awaiting Verification' : 'Payment Pending'}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions – Modern Card */}
          {provider && !isPaid && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="bg-orange-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
                  <ReceiptText size={20} /> Payment Instructions
                </h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  {provider.category === 'mobile_money' ? (
                    <Phone className="text-orange-500" size={22} />
                  ) : (
                    <Landmark className="text-orange-500" size={22} />
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Provider</p>
                    <p className="font-medium text-gray-800">{provider.name}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {provider.category === 'mobile_money' && provider.account_number && (
                    <div>
                      <p className="text-xs text-gray-500">Mobile Money Number</p>
                      <p className="text-xl font-mono font-bold text-gray-900">{provider.account_number}</p>
                    </div>
                  )}
                  {provider.category === 'bank' && (
                    <>
                      {provider.account_number && (
                        <div>
                          <p className="text-xs text-gray-500">Account Number</p>
                          <p className="text-xl font-mono font-bold text-gray-900">{provider.account_number}</p>
                        </div>
                      )}
                      {provider.account_name && (
                        <div>
                          <p className="text-xs text-gray-500">Account Name</p>
                          <p className="text-gray-800">{provider.account_name}</p>
                        </div>
                      )}
                      {provider.branch && (
                        <div>
                          <p className="text-xs text-gray-500">Branch</p>
                          <p className="text-gray-800">{provider.branch}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {provider.instructions ? (
                  <div className="prose prose-sm max-w-none text-gray-700 border-t pt-4">
                    <div dangerouslySetInnerHTML={{ __html: provider.instructions }} />
                  </div>
                ) : (
                  <div className="border-t pt-4 text-sm text-gray-500 italic">
                    No additional instructions. Please use the account details above.
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total to pay</span>
                    <span className="text-2xl font-bold text-orange-600">MWK {order.total_amount ? order.total_amount.toLocaleString() : '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Payment Proof – Redesigned Card */}
          {canUpload && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Upload size={20} className="text-orange-500" /> Upload Payment Proof
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-5">
                  After making the payment, take a screenshot or save the receipt and upload it here.
                </p>
                <form onSubmit={uploadProof} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot / Receipt *</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                        Choose File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                          className="hidden"
                          required
                        />
                      </label>
                      {proofFile && <span className="text-sm text-gray-600">{proofFile.name}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Accepted formats: JPG, PNG. Max size: 5MB.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference (optional)</label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="e.g., TRX-123456, Reference number from your bank"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (optional)</label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="Any extra information about your payment"
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
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Upload size={18} /> Submit Payment Proof
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Existing Proof Card */}
          {existing_proof && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText size={20} className="text-orange-500" /> Submitted Proof
                </h2>
              </div>
              <div className="p-6">
                <a href={existing_proof} target="_blank" rel="noopener noreferrer" className="text-orange-600 underline break-all hover:text-orange-700">
                  View uploaded proof image
                </a>
                {existing_note && <p className="text-sm text-gray-500 mt-2">Note: {existing_note}</p>}
                {isAwaiting && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    Your payment is being reviewed by our team. You will receive an email once verified.
                  </div>
                )}
                {canUpload && existing_proof && !isAwaiting && (
                  <button
                    onClick={cancelProof}
                    disabled={cancellingProof}
                    className="mt-4 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm transition"
                  >
                    <Trash2 size={14} /> {cancellingProof ? 'Removing...' : 'Cancel and remove this proof'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/account/orders')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                View My Orders <ArrowRight size={16} />
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-600 py-2.5 rounded-xl font-medium transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
