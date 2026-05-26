'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReceiptUploadPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [receiptText, setReceiptText] = useState('');
  const [useManual, setUseManual] = useState(false);
  const [manualData, setManualData] = useState({
    parcelId: '',
    receiverName: '',
    receiverPhone: '',
    receiverCity: '',
    totalAmount: '',
    paymentStatus: 'cod_unpaid',
    truckNumber: '',
    deliveryCounter: '',
    senderName: '',
    dateTime: '',
  });

  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    const res = await fetch(`/api/admin/orders/${orderId}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    if (imageUrl) formData.append('imageUrl', imageUrl);
    if (receiptText && !useManual) formData.append('receiptText', receiptText);
    if (useManual) formData.append('manualData', JSON.stringify(manualData));

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/receipt`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      toast.success('Receipt uploaded and tracking updated!');
      router.push(`/admin/orders/${orderId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Receipt</h1>
        <p className="text-gray-500 text-sm mt-1">
          Order #{order?.order_number?.slice(-8) || orderId.slice(-8)}
        </p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="mb-6">
          <div className="flex gap-4 border-b pb-3">
            <button
              type="button"
              onClick={() => setUseManual(false)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                !useManual ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              Paste Receipt Text
            </button>
            <button
              type="button"
              onClick={() => setUseManual(true)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                useManual ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Manual Entry
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image URL (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receipt Image URL (optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Upload image to Cloudinary and paste URL here
            </p>
          </div>

          {!useManual ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Text
              </label>
              <textarea
                value={receiptText}
                onChange={(e) => setReceiptText(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Paste CTS courier receipt text here..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Paste the full receipt text. The system will automatically extract tracking info.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parcel ID *</label>
                  <input
                    type="text"
                    value={manualData.parcelId}
                    onChange={(e) => setManualData({ ...manualData, parcelId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receiver Name *</label>
                  <input
                    type="text"
                    value={manualData.receiverName}
                    onChange={(e) => setManualData({ ...manualData, receiverName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receiver Phone</label>
                  <input
                    type="text"
                    value={manualData.receiverPhone}
                    onChange={(e) => setManualData({ ...manualData, receiverPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receiver City</label>
                  <input
                    type="text"
                    value={manualData.receiverCity}
                    onChange={(e) => setManualData({ ...manualData, receiverCity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount (MWK) *</label>
                  <input
                    type="number"
                    value={manualData.totalAmount}
                    onChange={(e) => setManualData({ ...manualData, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  <select
                    value={manualData.paymentStatus}
                    onChange={(e) => setManualData({ ...manualData, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="cod_unpaid">COD - Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Truck Number</label>
                  <input
                    type="text"
                    value={manualData.truckNumber}
                    onChange={(e) => setManualData({ ...manualData, truckNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Counter</label>
                  <input
                    type="text"
                    value={manualData.deliveryCounter}
                    onChange={(e) => setManualData({ ...manualData, deliveryCounter: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!useManual && !receiptText && !imageUrl)}
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin inline mr-2" size={16} /> : <Upload size={16} className="inline mr-2" />}
              {loading ? 'Processing...' : 'Upload Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
