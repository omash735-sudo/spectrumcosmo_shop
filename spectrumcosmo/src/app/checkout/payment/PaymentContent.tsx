'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Loader2, Upload, AlertCircle, Trash2, CheckCircle, Clock, 
  Phone, Landmark, ReceiptText, FileText, ArrowRight, Package, 
  Tag, Gift, ChevronDown, ChevronUp, Copy, Check, 
  CreditCard, CalendarClock, MessageCircle, HelpCircle,
  Shield, Banknote, Image as ImageIcon, X, Eye,
  Zap, Smartphone, Lock, AlertTriangle, Send, RefreshCw,
  DollarSign, Timer, FileCheck, Building, User, Mail, MapPin
} from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import toast from 'react-hot-toast';
import { orderService } from '@/lib/services/orderService';
import { Order, PaymentStatus, OrderStatus } from '@/lib/types/order';
import { STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/order-status';

type PaymentData = {
  order: {
    id: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    total_amount: number;
    subtotal: number;
    shipping_cost: number;
    discount_amount: number;
    payment_status: PaymentStatus;
    payment_method: string;
    status: OrderStatus;
    promo_code: string | null;
    promo_discount: number | null;
    referral_code: string | null;
    created_at: string;
    expires_at: string;
    delivery_quote_status?: 'pending' | 'quoted' | 'paid' | null;
    quoted_delivery_fee?: number | null;
    currency: string;
    display_amount: number;
    receiving_currency: string;
    receiving_amount: number;
  };
  provider: {
    name: string;
    type: string;
    category: string;
    account_name: string;
    account_number: string;
    branch: string;
    instructions: string;
    logo_url?: string;
  } | null;
  existing_proof: string | null;
  existing_note: string | null;
  existing_transaction_ref: string | null;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    image_url: string;
  }>;
};

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const isQuotePayment = searchParams.get('type') === 'delivery-quote';

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cancellingProof, setCancellingProof] = useState(false);
  const [showOrderItems, setShowOrderItems] = useState(false);
  const [polling, setPolling] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfsvnaslv';
  const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo_unsigned_upload';
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
        
        if (data.order.payment_status === 'awaiting_verification' && !polling) {
          startPolling();
        }
      } catch (err: any) {
        console.error('Load error:', err);
        setMessage({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  // Timer countdown effect
  useEffect(() => {
    if (!paymentData?.order?.expires_at) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(paymentData.order.expires_at);
      const diff = expiry.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Expired');
        // Redirect to orders if expired
        toast.error('Payment deadline has passed. Please check your orders.');
        setTimeout(() => router.push('/account/orders'), 2000);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days}d ${hours % 24}h remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s remaining`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [paymentData?.order?.expires_at, router]);

  const startPolling = () => {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/payment`);
        if (res.ok) {
          const data = await res.json();
          setPaymentData(data);
          if (data.order.payment_status === 'paid' || data.order.status === 'cancelled') {
            clearInterval(interval);
            setPolling(false);
            toast.success('Payment confirmed! Your order is being processed.');
            setTimeout(() => router.push('/account/orders'), 2000);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP files are allowed');
      setMessage({ type: 'error', text: 'Only JPG, PNG, and WEBP files are allowed' });
      return;
    }

    setProofFile(file);
    const preview = URL.createObjectURL(file);
    setProofPreview(preview);
    setMessage(null);
  };

  const removeFile = () => {
    setProofFile(null);
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
      setProofPreview(null);
    }
  };

  const uploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setMessage(null);

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error('Upload service not configured');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', proofFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.secure_url) throw new Error('Upload failed');

      await orderService.uploadPaymentProof(
        orderId!,
        uploadData.secure_url,
        note,
        transactionRef
      );

      toast.success('Payment proof submitted! Our team will verify within 24 hours.');
      setMessage({ type: 'success', text: 'Payment proof submitted! Our team will verify within 24 hours.' });
      removeFile();
      setTransactionRef('');
      setNote('');

      const refreshed = await fetch(`/api/orders/${orderId}/payment`);
      const newData = await refreshed.json();
      setPaymentData(newData);
      
      if (newData.order.payment_status === 'awaiting_verification') {
        startPolling();
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const cancelProof = async () => {
    if (!confirm('Remove your submitted proof? This action cannot be undone.')) return;
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
        toast.success('Proof removed. You can submit a new one.');
        setMessage({ type: 'success', text: 'Proof removed. You can submit a new one.' });
      }
    } catch (err: any) {
      toast.error(err.message);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCancellingProof(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!orderId) return;
    
    setRetryingPayment(true);
    try {
      const res = await fetch(`/api/payments/retry/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: paymentData?.order.customer_phone }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment retry failed');
      
      toast.success('Payment request sent to your phone');
      setTimeout(() => {
        router.push(`/account/orders?payment=pending&order=${orderId}`);
      }, 1500);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRetryingPayment(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  // Loading state with skeleton cards
  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[var(--background)] py-8 sm:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Skeleton Header */}
            <div className="text-center mb-8">
              <div className="h-8 w-48 bg-[var(--background-secondary)] rounded-lg animate-pulse mx-auto mb-2" />
              <div className="h-4 w-64 bg-[var(--background-secondary)] rounded-lg animate-pulse mx-auto" />
            </div>

            {/* Skeleton Steps */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--background-secondary)] rounded-full animate-pulse" />
                  <div className="h-3 w-16 bg-[var(--background-secondary)] rounded animate-pulse hidden sm:block" />
                  {i < 2 && <div className="w-8 sm:w-12 h-0.5 bg-[var(--background-secondary)] animate-pulse" />}
                </div>
              ))}
            </div>

            {/* Skeleton Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Skeleton Order Summary */}
                <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-6 py-4 bg-[var(--background-secondary)]">
                    <div className="h-5 w-32 bg-[var(--background)] rounded animate-pulse" />
                  </div>
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-14 h-14 bg-[var(--background-secondary)] rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-[var(--background-secondary)] rounded animate-pulse" />
                          <div className="h-3 w-1/4 bg-[var(--background-secondary)] rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-16 bg-[var(--background-secondary)] rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skeleton Payment Instructions */}
                <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-6 py-4 bg-[var(--primary)]/20">
                    <div className="h-5 w-40 bg-[var(--background-secondary)] rounded animate-pulse" />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="h-16 bg-[var(--background-secondary)] rounded-xl animate-pulse" />
                    <div className="h-12 bg-[var(--background-secondary)] rounded-xl animate-pulse" />
                    <div className="h-24 bg-[var(--background-secondary)] rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Skeleton Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-6 py-4 bg-[var(--background-secondary)]">
                    <div className="h-5 w-32 bg-[var(--background)] rounded animate-pulse" />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-[var(--background-secondary)] rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-[var(--background-secondary)] rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-[var(--background-secondary)] rounded animate-pulse" />
                    </div>
                    <div className="h-px bg-[var(--border)]" />
                    <div className="h-8 w-full bg-[var(--background-secondary)] rounded animate-pulse" />
                    <div className="h-12 w-full bg-[var(--background-secondary)] rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!paymentData) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[var(--background)] py-12">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] p-8 text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-500 w-10 h-10" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Order Not Found</h2>
              <p className="text-[var(--foreground-muted)] mb-6">We couldn't find your payment details. Please check your order number.</p>
              <button 
                onClick={() => router.push('/account/orders')} 
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-3 rounded-xl font-medium transition"
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

  const { order, provider, existing_proof, existing_note, existing_transaction_ref, items } = paymentData;
  
  const displayCurrency = order.currency || 'MWK';
  const displayAmount = order.display_amount || order.total_amount;
  const receivingCurrency = order.receiving_currency || 'MWK';
  const receivingAmount = order.receiving_amount || order.total_amount;
  
  const isPaid = order.payment_status === 'paid';
  const isAwaiting = order.payment_status === 'awaiting_verification';
  const isPendingProducts = order.payment_status === 'pending_products';
  const isCancelled = order.status === 'cancelled';
  const isQuoteOrder = order.delivery_quote_status === 'quoted';
  const canUpload = !isPaid && !isAwaiting && !isCancelled && !isQuoteOrder && !isPendingProducts;
  const hasExpiry = order.expires_at && new Date(order.expires_at) > new Date();
  const needsConversion = displayCurrency !== receivingCurrency;
  const isExpired = timeRemaining === 'Expired';

  const orderStatusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const paymentStatusConfig = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.pending;

  // Simplified steps - only Order Placed and Payment Submitted
  const steps = [
    { label: 'Order Placed', status: true },
    { label: 'Payment Submitted', status: isAwaiting || isPaid },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
              {isQuoteOrder ? 'Complete Delivery Payment' : 'Complete Your Payment'}
            </h1>
            <p className="text-[var(--foreground-muted)] text-sm mt-2">
              {isQuoteOrder 
                ? 'Pay your quoted delivery fee to confirm your order'
                : 'Submit your payment proof to confirm your order'}
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {steps.map((step, idx) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      step.status 
                        ? 'bg-[var(--primary)] text-white' 
                        : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
                    }`}>
                      {step.status ? <CheckCircle size={16} /> : idx + 1}
                    </div>
                    <span className={`text-xs sm:text-sm hidden sm:inline ${step.status ? 'text-[var(--foreground)] font-medium' : 'text-[var(--foreground-muted)]'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${step.status ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            <div className="lg:col-span-2 space-y-6">
              
              {/* Timer Card - Simple square with curved corners */}
              {hasExpiry && canUpload && !isExpired && (
                <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 flex items-center gap-3">
                  <div className="p-2 bg-[var(--background-secondary)] rounded-lg">
                    <Timer className="text-[var(--foreground-muted)] w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Payment Deadline</p>
                    <p className="text-sm text-[var(--primary)] font-semibold">{timeRemaining}</p>
                  </div>
                </div>
              )}

              {isExpired && (
                <div className="bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 p-4 flex items-center gap-3">
                  <AlertTriangle className="text-red-500 w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Payment Deadline Passed</p>
                    <p className="text-xs text-red-600 dark:text-red-500">Redirecting to orders...</p>
                  </div>
                </div>
              )}

              {isQuoteOrder && (
                <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[var(--primary)] rounded-full flex items-center justify-center">
                      <Send size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--foreground)]">Delivery Quote Accepted</h2>
                      <p className="text-sm text-[var(--foreground-muted)]">Quoted delivery fee: {formatCurrency(order.quoted_delivery_fee || 0, displayCurrency)}</p>
                    </div>
                  </div>
                  <div className="bg-[var(--background-secondary)] rounded-xl p-4 mb-4 border border-[var(--border)]">
                    <p className="text-sm text-[var(--foreground-muted)] mb-2">Your delivery fee has been quoted by our team. Complete the payment below to confirm your order.</p>
                    <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                      <span className="text-sm font-medium text-[var(--foreground)]">Amount to Pay:</span>
                      <span className="text-2xl font-bold text-[var(--primary)]">{formatCurrency(order.quoted_delivery_fee || 0, displayCurrency)}</span>
                    </div>
                  </div>
                  {isPendingProducts && (
                    <button
                      onClick={handleRetryPayment}
                      disabled={retryingPayment}
                      className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                    >
                      {retryingPayment ? <Loader2 className="animate-spin" size={18} /> : <Smartphone size={18} />}
                      Pay Delivery Fee via Mobile Money
                    </button>
                  )}
                </div>
              )}

              <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
                <button
                  onClick={() => setShowOrderItems(!showOrderItems)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-[var(--background-secondary)] hover:bg-[var(--background-secondary)] transition"
                >
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-[var(--primary)]" />
                    <span className="font-semibold text-[var(--foreground)]">Order Summary</span>
                    <span className="text-xs text-[var(--foreground-muted)] bg-[var(--background)] px-2 py-0.5 rounded-full">
                      {items?.length || 0} items
                    </span>
                  </div>
                  {showOrderItems ? <ChevronUp size={18} className="text-[var(--foreground-muted)]" /> : <ChevronDown size={18} className="text-[var(--foreground-muted)]" />}
                </button>
                
                {showOrderItems && (
                  <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                    {items?.map((item) => (
                      <div key={item.id} className="flex gap-3 py-3 border-b border-[var(--border)] last:border-0">
                        <div className="w-14 h-14 bg-[var(--background-secondary)] rounded-lg overflow-hidden flex-shrink-0">
                          {item.image_url && (
                            <Image src={item.image_url} alt={item.product_name} width={56} height={56} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--foreground)] text-sm line-clamp-2">{item.product_name}</p>
                          <p className="text-xs text-[var(--foreground-muted)] mt-1">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-[var(--foreground)] text-sm whitespace-nowrap">
                          {formatCurrency(item.total_price, displayCurrency)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {provider && !isPaid && !isQuoteOrder && (
                <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="bg-[var(--primary)] px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Banknote size={20} />
                      Payment Instructions
                    </h2>
                    <p className="text-orange-100 text-xs mt-1">Follow these steps to complete your payment</p>
                  </div>
                  
                  <div className="p-6 space-y-5">
                    <div className="flex items-center gap-4 p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
                      <div className="w-12 h-12 bg-[var(--background-card)] rounded-full flex items-center justify-center border border-[var(--border)]">
                        {provider.category === 'mobile_money' ? (
                          <Smartphone className="text-[var(--primary)]" size={24} />
                        ) : (
                          <Building className="text-[var(--primary)]" size={24} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-[var(--foreground-muted)]">Payment Provider</p>
                        <p className="font-semibold text-[var(--foreground)] text-lg">{provider.name}</p>
                        <p className="text-xs text-[var(--foreground-muted)] capitalize">{provider.category?.replace('_', ' ')}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {provider.category === 'mobile_money' && provider.account_number && (
                        <div className="p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
                          <p className="text-xs text-[var(--foreground-muted)] mb-1 flex items-center gap-1">
                            <Smartphone size={12} className="text-[var(--primary)]" /> Mobile Money Number
                          </p>
                          <div className="flex items-center justify-between">
                            <code className="text-xl font-mono font-bold text-[var(--foreground)]">{provider.account_number}</code>
                            <button
                              onClick={() => copyToClipboard(provider.account_number!)}
                              className="p-2 hover:bg-[var(--background)] rounded-lg transition"
                            >
                              {copied === provider.account_number ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-[var(--foreground-muted)]" />}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {provider.category === 'bank' && (
                        <>
                          {provider.account_number && (
                            <div className="p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
                              <p className="text-xs text-[var(--foreground-muted)] mb-1 flex items-center gap-1">
                                <CreditCard size={12} className="text-[var(--primary)]" /> Account Number
                              </p>
                              <div className="flex items-center justify-between">
                                <code className="text-xl font-mono font-bold text-[var(--foreground)]">{provider.account_number}</code>
                                <button
                                  onClick={() => copyToClipboard(provider.account_number!)}
                                  className="p-2 hover:bg-[var(--background)] rounded-lg transition"
                                >
                                  {copied === provider.account_number ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-[var(--foreground-muted)]" />}
                                </button>
                              </div>
                            </div>
                          )}
                          {provider.account_name && (
                            <div className="p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
                              <p className="text-xs text-[var(--foreground-muted)] mb-1">Account Name</p>
                              <p className="font-bold text-[var(--foreground)]">{provider.account_name}</p>
                            </div>
                          )}
                          {provider.branch && (
                            <div className="p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
                              <p className="text-xs text-[var(--foreground-muted)] mb-1">Branch</p>
                              <p className="font-bold text-[var(--foreground)]">{provider.branch}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {provider.instructions && (
                      <div className="p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)] space-y-3">
                        <p className="font-bold text-[var(--foreground)] flex items-center gap-2">
                          <FileText size={14} className="text-[var(--primary)]" /> Important Instructions
                        </p>
                        <div className="text-[var(--foreground)] space-y-3 [&>p]:space-y-2 [&>ul]:space-y-2 [&>ol]:space-y-2 [&>li]:space-y-2 [&>p]:leading-relaxed [&>li]:leading-relaxed" 
                             dangerouslySetInnerHTML={{ __html: provider.instructions }} />
                      </div>
                    )}

                    <div className="border-t border-[var(--border)] pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--foreground-muted)]">Total Amount to Pay</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-[var(--primary)]">
                            {formatCurrency(displayAmount, displayCurrency)}
                          </span>
                          {needsConversion && (
                            <p className="text-xs text-[var(--foreground-muted)]">
                              ≈ {formatCurrency(receivingAmount, receivingCurrency)} (we receive in {receivingCurrency})
                            </p>
                          )}
                          {order.discount_amount > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400">Includes {formatCurrency(order.discount_amount, displayCurrency)} discount</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {provider?.type === 'automatic' && !isPaid && !isQuoteOrder && (
                <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="bg-green-600 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Zap size={20} />
                      Instant Payment
                    </h2>
                    <p className="text-green-100 text-xs mt-1">Pay directly from your mobile money</p>
                  </div>
                  <div className="p-6 text-center">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone size={40} className="text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-[var(--foreground-muted)] mb-4">Click the button below to receive a payment request on your phone</p>
                    <button
                      onClick={handleRetryPayment}
                      disabled={retryingPayment}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                    >
                      {retryingPayment ? <Loader2 className="animate-spin" size={18} /> : <Smartphone size={18} />}
                      Pay with {provider.name}
                    </button>
                  </div>
                </div>
              )}

              {canUpload && !isQuoteOrder && (
                <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                    <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                      <Upload size={18} className="text-[var(--primary)]" />
                      Upload Payment Proof
                    </h2>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">After making payment, upload your receipt or screenshot here</p>
                  </div>
                  <div className="p-6">
                    <form onSubmit={uploadProof} className="space-y-5">
                      {!proofFile ? (
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer
                            ${dragActive ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] hover:border-[var(--primary)] bg-[var(--background-secondary)] hover:bg-[var(--background)]'}`}
                          onClick={() => document.getElementById('file-input')?.click()}
                        >
                          <Upload className={`w-10 h-10 mx-auto mb-3 transition ${dragActive ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'}`} />
                          <p className="text-sm text-[var(--foreground-muted)]">Drag and drop your receipt here, or click to browse</p>
                          <p className="text-xs text-[var(--foreground-muted)] mt-1">PNG, JPG, WEBP up to 5MB</p>
                          <input
                            id="file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--background-secondary)]">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-[var(--background)] rounded-lg overflow-hidden flex-shrink-0">
                              {proofPreview && (
                                <Image src={proofPreview} alt="Preview" width={64} height={64} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[var(--foreground)] truncate">{proofFile.name}</p>
                              <p className="text-xs text-[var(--foreground-muted)]">{(proofFile.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <button
                              type="button"
                              onClick={removeFile}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Transaction Reference (Optional)</label>
                        <input
                          type="text"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          className="w-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                          placeholder="e.g., TRX-123456, Reference number from your bank"
                        />
                        <p className="text-xs text-[var(--foreground-muted)] mt-1">Helps us verify your payment faster</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Additional Notes (Optional)</label>
                        <textarea
                          rows={2}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                          placeholder="Any extra information about your payment"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={uploading || !proofFile}
                        className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Submit Payment Proof
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {existing_proof && (
                <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className={`px-6 py-4 border-b border-[var(--border)] ${isAwaiting ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-green-50 dark:bg-green-950/30'}`}>
                    <h2 className={`font-semibold flex items-center gap-2 ${isAwaiting ? 'text-blue-700 dark:text-blue-400' : 'text-green-700 dark:text-green-400'}`}>
                      {isAwaiting ? <Clock size={18} /> : <CheckCircle size={18} />}
                      {isAwaiting ? 'Payment Under Review' : 'Payment Proof Submitted'}
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <ImageIcon className="text-[var(--foreground-muted)]" size={20} />
                      <a href={existing_proof} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:text-[var(--primary-hover)] underline text-sm flex items-center gap-1">
                        <Eye size={14} /> View uploaded receipt
                      </a>
                    </div>
                    {existing_transaction_ref && (
                      <div className="mb-3 p-3 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)]">
                        <p className="text-xs text-[var(--foreground-muted)]">Transaction Reference</p>
                        <p className="text-sm font-mono font-medium text-[var(--foreground)]">{existing_transaction_ref}</p>
                      </div>
                    )}
                    {existing_note && (
                      <div className="mb-3">
                        <p className="text-xs text-[var(--foreground-muted)]">Notes</p>
                        <p className="text-sm text-[var(--foreground)]">{existing_note}</p>
                      </div>
                    )}
                    {isAwaiting && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-2">
                        <Clock size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Your payment is being reviewed</p>
                          <p className="text-xs text-blue-600 dark:text-blue-500">We'll notify you once verified. This usually takes 24-48 hours.</p>
                        </div>
                      </div>
                    )}
                    {canUpload && existing_proof && !isAwaiting && (
                      <button
                        onClick={cancelProof}
                        disabled={cancellingProof}
                        className="mt-4 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm transition"
                      >
                        <Trash2 size={14} />
                        {cancellingProof ? 'Removing...' : 'Cancel and submit a new proof'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden sticky top-24">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                  <h2 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <ReceiptText size={18} className="text-[var(--primary)]" />
                    Order Summary
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Order #{order.id.slice(-8)}</span>
                    <span className="text-xs text-[var(--foreground-muted)]">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Subtotal</span>
                    <span className="text-[var(--foreground)]">{formatCurrency(order.subtotal || order.total_amount, displayCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Shipping</span>
                    <span className="text-[var(--foreground)]">{formatCurrency(order.shipping_cost || 0, displayCurrency)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>- {formatCurrency(order.discount_amount, displayCurrency)}</span>
                    </div>
                  )}
                  {order.promo_code && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 text-[var(--foreground-muted)]">
                        <Tag size={12} /> Promo: {order.promo_code}
                      </span>
                      <span className="text-green-600 dark:text-green-400">{order.promo_discount}% off</span>
                    </div>
                  )}
                  {order.referral_code && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 text-[var(--foreground-muted)]">
                        <Gift size={12} /> Referral: {order.referral_code}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-[var(--border)] pt-3 flex flex-col">
                    <div className="flex justify-between font-bold">
                      <span className="text-[var(--foreground)]">Total</span>
                      <span className="text-[var(--primary)] text-xl">{formatCurrency(displayAmount, displayCurrency)}</span>
                    </div>
                    {needsConversion && (
                      <div className="flex justify-between text-xs text-[var(--foreground-muted)] mt-1">
                        <span>We receive in {receivingCurrency}</span>
                        <span>{formatCurrency(receivingAmount, receivingCurrency)}</span>
                      </div>
                    )}
                  </div>

                  <div className={`mt-4 p-3 rounded-xl text-center ${orderStatusConfig.bg}`}>
                    <div className={`flex items-center justify-center gap-2 ${orderStatusConfig.color}`}>
                      <orderStatusConfig.icon size={16} />
                      <span className="font-medium text-sm">{orderStatusConfig.label}</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl text-center ${paymentStatusConfig.bg}`}>
                    <div className={`flex items-center justify-center gap-2 ${paymentStatusConfig.color}`}>
                      {order.payment_status === 'paid' && <CheckCircle size={16} />}
                      {order.payment_status === 'pending' && <Clock size={16} />}
                      {order.payment_status === 'awaiting_verification' && <AlertCircle size={16} />}
                      {order.payment_status === 'pending_products' && <Clock size={16} />}
                      <span className="font-medium text-sm">Payment: {paymentStatusConfig.label}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                        <Lock size={12} className="text-green-600 dark:text-green-400" />
                        SSL Secure
                      </div>
                      <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
                      <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                        <Shield size={12} className="text-green-600 dark:text-green-400" />
                        Buyer Protection
                      </div>
                      <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
                      <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                        <FileCheck size={12} className="text-green-600 dark:text-green-400" />
                        Verified Payment
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--foreground-muted)] text-center">Need help with payment?</p>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <button
                        onClick={() => router.push('/contact')}
                        className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1 transition"
                      >
                        <HelpCircle size={12} /> Support
                      </button>
                      <button
                        onClick={() => window.open('https://wa.me/265893160202', '_blank')}
                        className="text-xs text-green-500 hover:text-green-600 flex items-center gap-1 transition"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-[var(--background-secondary)] rounded-xl p-4 border border-[var(--border)]">
                <div className="flex items-start gap-3">
                  <FileCheck size={16} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-[var(--foreground)]">Payment Tips</p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">
                      Include your order number as reference when making payment for faster verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
