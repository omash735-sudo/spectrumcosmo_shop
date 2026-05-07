'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price_usd: number;
  custom_details?: string;
};

type Order = {
  id: string;
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  payment_method: string;
  total_amount: number;
  status: string;
  created_at: string;
  proof_of_payment?: string;
  payment_note?: string;
  items: OrderItem[];
};

type PaymentOption = {
  id: string;
  type: string;
  name: string;
  logo_url: string;
  account_number: string;
  is_active: boolean;
};

export default function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!orderId) {
      setMessage({ type: 'error', text: 'No order specified. Please return to checkout.' });
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [orderRes, optsRes] = await Promise.all([
          fetch(`/api/orders/${orderId}`),
          fetch('/api/payment-options'),
        ]);

        if (!orderRes.ok) {
          const errorData = await orderRes.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${orderRes.status}`);
        }

        const orderData = await orderRes.json();
        setOrder(orderData);

        if (optsRes.ok) {
          const opts = await optsRes.json();
          setPaymentOptions(opts.filter((opt: PaymentOption) => opt.is_active));
        }
      } catch (err: any) {
        console.error('Load error:', err);
        setMessage({ type: 'error', text: err.message || 'Failed to load order details.' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [orderId]);

  const uploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !proofFile) {
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
      if (!uploadData.secure_url) throw new Error('Image upload failed');

      const updateRes = await fetch('/api/account/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          proofOfPaymentUrl: uploadData.secure_url,
          paymentNote: note,
        }),
      });
      if (!updateRes.ok) throw new Error('Failed to save proof');

      setMessage({ type: 'success', text: 'Proof submitted! Redirecting...' });
      setTimeout(() => router.push('/thank-you'), 2000);
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
          <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
        </main>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen p-6 text-center">
          <div className="max-w-md mx-auto bg-white rounded-xl p-6 shadow-sm">
            <AlertCircle className="text-red-500 w-12 h-12 mx-auto mb-3" />
            <p className="text-gray-700">Order not found.</p>
            <p className="text-xs text-gray-500 mt-2 break-all">Order ID: {orderId || 'missing'}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 text-orange-600 hover:underline"
            >
              Return to home
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const productNames = order.items.map((i) => i.product_name).join(', ');
  const displayProduct = productNames || order.customer_name || 'Order';

  const selectedOption = paymentOptions.find(
    (opt) => opt.name === order.payment_method || opt.type === order.payment_method
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
            <h1 className="text-2xl font-bold mb-2">Complete Payment</h1>
            <p className="text-gray-500 mb-6">Order: {displayProduct}</p>

            {selectedOption && (
              <div className="bg-amber-50 rounded-xl p-5 mb-6 border border-amber-200">
                <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                  <AlertCircle size={18} /> Payment Instructions
                </h3>
                <div className="flex items-center gap-3">
                  {selectedOption.logo_url && (
                    <Image
                      src={selectedOption.logo_url}
                      alt={selectedOption.name}
                      width={48}
                      height={48}
                    />
                  )}
                  <div>
                    <p className="text-sm text-amber-700">
                      {selectedOption.type === 'mobile_money' ? (
                        <>Send the exact amount to this mobile money number: <strong className="block font-mono text-base mt-1">{selectedOption.account_number}</strong></>
                      ) : selectedOption.type === 'bank' ? (
                        <>Transfer to this bank account: <strong className="block font-mono text-base mt-1">{selectedOption.account_number}</strong></>
                      ) : (
                        <>Send the exact amount to: <strong className="block font-mono text-base mt-1">{selectedOption.account_number}</strong></>
                      )}
                    </p>
                    {order.total_amount && (
                      <p className="text-sm mt-2">Amount: <strong>MWK {order.total_amount.toLocaleString()}</strong></p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={uploadProof} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Upload payment proof (screenshot/receipt)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  required
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Optional note (e.g., transaction reference)
                </label>
                <textarea
                  rows={2}
                  className="w-full border rounded-xl p-2 text-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              {message && (
                <div
                  className={`p-3 rounded-xl text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {message.text}
                </div>
              )}
              <button
                type="submit"
                disabled={uploading || !proofFile}
                className="w-full bg-orange-600 text-white py-2.5 rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="animate-spin inline mr-2 w-4 h-4" />
                ) : (
                  <Upload className="inline mr-2" size={16} />
                )}
                {uploading ? 'Submitting...' : 'Submit Payment Proof'}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-6">
              Your payment will be reviewed by our team. You can track status in your account.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
