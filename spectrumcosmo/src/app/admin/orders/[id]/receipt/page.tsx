'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Loader2, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MapPin,
  Phone,
  Truck,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

// ===== SKELETON =====
function ReceiptUploadSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-4 bg-[var(--background-secondary)] rounded w-24" />
        <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
      </div>
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-6">
        <div className="flex gap-4 mb-6">
          <div className="h-10 bg-[var(--background-secondary)] rounded w-32" />
          <div className="h-10 bg-[var(--background-secondary)] rounded w-32" />
        </div>
        <div className="h-48 bg-[var(--background-secondary)] rounded" />
        <div className="h-10 bg-[var(--background-secondary)] rounded w-full mt-4" />
      </div>
    </div>
  );
}

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
  const [fetchingOrder, setFetchingOrder] = useState(true);

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

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setFetchingOrder(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order || data);
        // Pre-fill manual data from order
        if (data.order || data) {
          const orderData = data.order || data;
          setManualData(prev => ({
            ...prev,
            receiverName: orderData.customer_name || '',
            receiverPhone: orderData.phone_number || '',
            totalAmount: orderData.total_amount?.toString() || '',
            receiverCity: orderData.delivery_address?.split(',')?.pop()?.trim() || '',
          }));
        }
      } else {
        toast.error('Failed to load order details');
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
      toast.error('Failed to load order');
    } finally {
      setFetchingOrder(false);
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
      } else {
        throw new Error('Upload failed');
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
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
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

    let payload: any = {};

    if (imageUrl) {
      payload.imageUrl = imageUrl;
    }

    if (!useManual && receiptText) {
      payload.receiptText = receiptText;
    }

    if (useManual) {
      payload.manualData = manualData;
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
      toast.error(err.message || 'Failed to upload receipt');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingOrder) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-3xl mx-auto">
          <ReceiptUploadSkeleton />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <XCircle size={48} className="text-red-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Order not found</h2>
          <p className="text-sm text-[var(--foreground-muted)] mt-2">This order may have been deleted</p>
          <Link href="/admin/orders" className="inline-block mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium">
            Back to orders →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link
            href={`/admin/orders/${orderId}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition mb-2 sm:mb-3"
          >
            <ArrowLeft size={16} />
            Back to Order
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Upload Receipt</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
              Order #{order?.order_number?.slice(-8) || orderId.slice(-8)}
            </p>
            <span className="w-px h-4 bg-[var(--border)] hidden sm:block" />
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
              <User size={12} className="inline mr-1" />
              {order?.customer_name || 'Unknown'}
            </p>
            {order?.phone_number && (
              <>
                <span className="w-px h-4 bg-[var(--border)] hidden sm:block" />
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                  <Phone size={12} className="inline mr-1" />
                  {order.phone_number}
                </p>
              </>
            )}
            {order?.total_amount && (
              <>
                <span className="w-px h-4 bg-[var(--border)] hidden sm:block" />
                <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                  MWK {Number(order.total_amount).toLocaleString()}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-6 shadow-sm">
          {/* Tabs */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
              <button
                type="button"
                onClick={() => setUseManual(false)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition min-h-[40px] ${
                  !useManual
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                }`}
              >
                <FileText size={16} />
                Paste Receipt Text
              </button>
              <button
                type="button"
                onClick={() => setUseManual(true)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition min-h-[40px] ${
                  useManual
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                }`}
              >
                <Upload size={16} />
                Manual Entry
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Image Upload */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5 sm:mb-2">
                Receipt Image <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-4 sm:p-6 text-center hover:border-[var(--primary)] transition">
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
                      <ImageIcon size={36} className="sm:size-10 text-[var(--foreground-muted)] opacity-40 mb-2" />
                      <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">Click to upload receipt image</span>
                      <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)] opacity-60">PNG, JPG up to 5MB</span>
                    </label>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <Image
                      src={imagePreview}
                      alt="Receipt preview"
                      width={250}
                      height={180}
                      className="mx-auto rounded-lg object-contain max-h-40 sm:max-h-48"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition shadow-lg"
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
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                  <CheckCircle size={12} /> Image uploaded successfully
                </p>
              )}
            </div>

            {/* Receipt Text or Manual Form */}
            {!useManual ? (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                  Receipt Text
                </label>
                <textarea
                  value={receiptText}
                  onChange={(e) => setReceiptText(e.target.value)}
                  rows={12}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl font-mono text-xs sm:text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none"
                  placeholder="Paste CTS courier receipt text here..."
                />
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] opacity-70">
                    Paste the full receipt text. The system will automatically extract tracking info.
                  </p>
                  <span className="text-[10px] text-[var(--foreground-muted)]">
                    {receiptText.length} characters
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)] flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <AlertCircle size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>Enter the tracking details manually. All fields marked with <span className="text-red-500">*</span> are required.</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Parcel ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualData.parcelId}
                      onChange={(e) => setManualData({ ...manualData, parcelId: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      placeholder="e.g., CTS-12345"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Receiver Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualData.receiverName}
                      onChange={(e) => setManualData({ ...manualData, receiverName: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Receiver Phone
                    </label>
                    <input
                      type="text"
                      value={manualData.receiverPhone}
                      onChange={(e) => setManualData({ ...manualData, receiverPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Receiver City
                    </label>
                    <input
                      type="text"
                      value={manualData.receiverCity}
                      onChange={(e) => setManualData({ ...manualData, receiverCity: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Total Amount (MWK) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={manualData.totalAmount}
                      onChange={(e) => setManualData({ ...manualData, totalAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Payment Status
                    </label>
                    <select
                      value={manualData.paymentStatus}
                      onChange={(e) => setManualData({ ...manualData, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                    >
                      <option value="cod_unpaid">COD - Unpaid</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Truck Number
                    </label>
                    <input
                      type="text"
                      value={manualData.truckNumber}
                      onChange={(e) => setManualData({ ...manualData, truckNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      placeholder="Truck registration"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Delivery Counter
                    </label>
                    <input
                      type="text"
                      value={manualData.deliveryCounter}
                      onChange={(e) => setManualData({ ...manualData, deliveryCounter: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      placeholder="Counter number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2.5 border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition text-[var(--foreground)] text-sm min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!useManual && !receiptText && !imageUrl)}
                className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium min-h-[44px]"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {loading ? 'Processing...' : 'Upload Receipt'}
              </button>
            </div>

            {/* Validation Message */}
            {!useManual && !receiptText && !imageUrl && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle size={12} />
                Please either upload an image or paste receipt text
              </p>
            )}
          </form>
        </div>

        {/* Helpful Tips */}
        <div className="mt-4 sm:mt-6 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-400">
                <strong>Pro Tip:</strong> You can either:
              </p>
              <ul className="text-xs sm:text-sm text-orange-700 dark:text-orange-400 mt-1 space-y-0.5 list-disc list-inside">
                <li>Upload a screenshot/photo of the courier receipt</li>
                <li>Paste the CTS courier receipt text for auto-extraction</li>
                <li>Manually enter the tracking details</li>
              </ul>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1.5 opacity-70">
                The tracking number will be extracted and the order status will be updated automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
