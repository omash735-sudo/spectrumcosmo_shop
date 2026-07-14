'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Upload, FileText, Image as ImageIcon, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminReceiptUploadPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [receiptText, setReceiptText] = useState('');
  const [useManual, setUseManual] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        toast.success('Image uploaded successfully');
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: any = {};

    if (imageUrl) {
      payload.imageUrl = imageUrl;
    }

    if (!useManual && receiptText) {
      payload.receiptText = receiptText;
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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

  if (!order) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/admin/orders/${orderId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft size={16} />
          Back to Order
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Receipt</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Order #{order?.order_number?.slice(-8) || orderId.slice(-8)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Customer: {order?.customer_name}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="mb-6">
          <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-3">
            <button
              type="button"
              onClick={() => setUseManual(false)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                !useManual
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              Paste Receipt Text
            </button>
            <button
              type="button"
              onClick={() => setUseManual(true)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                useManual
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Upload Image
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Receipt Image
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center">
              {!imagePreview ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                    id="receipt-image"
                  />
                  <label
                    htmlFor="receipt-image"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <ImageIcon size={40} className="text-gray-400 dark:text-gray-600 mb-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload receipt image</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG up to 5MB</span>
                  </label>
                </div>
              ) : (
                <div className="relative inline-block">
                  <Image
                    src={imagePreview}
                    alt="Receipt preview"
                    width={200}
                    height={150}
                    className="mx-auto rounded-lg object-contain max-h-32"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  )}
                </div>
              )}
            </div>
            {imageUrl && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Image uploaded successfully</p>
            )}
          </div>

          {!useManual ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Receipt Text
              </label>
              <textarea
                value={receiptText}
                onChange={(e) => setReceiptText(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                placeholder="Paste CTS courier receipt text here..."
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Paste the full receipt text. The system will automatically extract tracking info.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Parcel ID *</label>
                  <input
                    type="text"
                    value={manualData.parcelId}
                    onChange={(e) => setManualData({ ...manualData, parcelId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Name *</label>
                  <input
                    type="text"
                    value={manualData.receiverName}
                    onChange={(e) => setManualData({ ...manualData, receiverName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Receiver Phone</label>
                  <input
                    type="text"
                    value={manualData.receiverPhone}
                    onChange={(e) => setManualData({ ...manualData, receiverPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Receiver City</label>
                  <input
                    type="text"
                    value={manualData.receiverCity}
                    onChange={(e) => setManualData({ ...manualData, receiverCity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount (MWK) *</label>
                  <input
                    type="number"
                    value={manualData.totalAmount}
                    onChange={(e) => setManualData({ ...manualData, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</label>
                  <select
                    value={manualData.paymentStatus}
                    onChange={(e) => setManualData({ ...manualData, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                  >
                    <option value="cod_unpaid">COD - Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Truck Number</label>
                  <input
                    type="text"
                    value={manualData.truckNumber}
                    onChange={(e) => setManualData({ ...manualData, truckNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Counter</label>
                  <input
                    type="text"
                    value={manualData.deliveryCounter}
                    onChange={(e) => setManualData({ ...manualData, deliveryCounter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!useManual && !receiptText && !imageUrl)}
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {loading ? 'Processing...' : 'Upload Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
