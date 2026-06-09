'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Loader2, Upload, AlertCircle, Trash2, CheckCircle, Clock, 
  Phone, Landmark, ReceiptText, FileText, ArrowRight, Package, 
  Tag, Gift, ChevronDown, ChevronUp, Copy, Check, 
  CreditCard, CalendarClock, MessageCircle, HelpCircle,
  Shield, Banknote, Image as ImageIcon, X, Eye,
  Zap, Smartphone, Lock, Sparkles, AlertTriangle, Send, RefreshCw,
  DollarSign, Timer, FileCheck, Building, User, Mail, MapPin
} from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import toast from 'react-hot-toast';

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
    payment_status: string;
    payment_method: string;
    status: string;
    promo_code: string | null;
    promo_discount: number | null;
    referral_code: string | null;
    created_at: string;
    expires_at: string;
    delivery_quote_status?: string;
    quoted_delivery_fee?: number;
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

export default function PaymentContent() {
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
    if (file.size > 5 * 1024 * 1024) {
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

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast.error('Upload service not configured');
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

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 2) return `${days} days remaining`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''} remaining`;
    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
              <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500 w-6 h-6 animate-pulse" />
            </div>
            <p className="text-gray-500 mt-4">Loading payment details...</p>
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
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-500 w-10 h-10" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
              <p className="text-gray-500 mb-6">We couldn't find your payment details. Please check your order number.</p>
              <button 
                onClick={() => router.push('/account/orders')} 
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition shadow-sm"
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
  const isPaid = order.payment_status === 'paid';
  const isAwaiting = order.payment_status === 'awaiting_verification';
  const isCancelled = order.status === 'cancelled';
  const isQuoteOrder = order.delivery_quote_status === 'quoted';
  const canUpload = !isPaid && !isAwaiting && !isCancelled && !isQuoteOrder;
  const hasExpiry = order.expires_at && new Date(order.expires_at) > new Date();

  const steps = [
    { label: 'Order Placed', status: order.payment_status !== 'pending' || isPaid || isAwaiting },
    { label: isQuoteOrder ? 'Quote Received' : 'Payment Submitted', status: isQuoteOrder || isAwaiting || isPaid },
    { label: 'Confirmed', status: isPaid },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isQuoteOrder ? 'Complete Delivery Payment' : 'Complete Your Payment'}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              {isQuoteOrder 
                ? 'Pay your quoted delivery fee to confirm your order'
                : 'Submit your payment proof to confirm your order'}
            </p>
          </div>

          {/* Step Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {steps.map((step, idx) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      step.status 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step.status ? <CheckCircle size={16} /> : idx + 1}
                    </div>
                    <span className={`text-xs sm:text-sm hidden sm:inline ${step.status ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${step.status ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* LEFT COLUMN - Payment Instructions and Upload */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Payment Deadline Warning */}
              {hasExpiry && canUpload && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                  <Timer className="text-yellow-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">Payment Deadline</p>
                    <p className="text-xs text-yellow-700">Complete your payment before {new Date(order.expires_at).toLocaleString()} to avoid order cancellation.</p>
                    <p className="text-xs font-medium text-yellow-800 mt-1">{getTimeRemaining(order.expires_at)}</p>
                  </div>
                </div>
              )}

              {/* Quote Payment Card (for delivery quote orders) */}
              {isQuoteOrder && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Send size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-blue-800">Delivery Quote Accepted</h2>
                      <p className="text-sm text-blue-600">Quoted delivery fee: MWK {order.quoted_delivery_fee?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">Your delivery fee has been quoted by our team. Complete the payment below to confirm your order.</p>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Amount to Pay:</span>
                      <span className="text-2xl font-bold text-blue-600">MWK {order.quoted_delivery_fee?.toLocaleString()}</span>
                    </div>
                  </div>
                  {order.payment_status === 'pending_products' && (
                    <button
                      onClick={handleRetryPayment}
                      disabled={retryingPayment}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition flex items-center justify-center gap-2"
                    >
                      {retryingPayment ? <Loader2 className="animate-spin" size={18} /> : <Smartphone size={18} />}
                      Pay Delivery Fee via Mobile Money
                    </button>
                  )}
                </div>
              )}

              {/* Order Summary Card - Collapsible */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setShowOrderItems(!showOrderItems)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-orange-500" />
                    <span className="font-semibold text-gray-800">Order Summary</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {items?.length || 0} items
                    </span>
                  </div>
                  {showOrderItems ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>
                
                {showOrderItems && (
                  <div className="p-6 space-y-3 max-h-96 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                    {items?.map((item) => (
                      <div key={item.id} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                        <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image_url && (
                            <Image src={item.image_url} alt={item.product_name} width={56} height={56} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm line-clamp-2">{item.product_name}</p>
                          <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-gray-800 text-sm whitespace-nowrap">
                          MWK {item.total_price.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Instructions Card - Manual Payment Only */}
              {provider && !isPaid && !isQuoteOrder && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Banknote size={20} />
                      Payment Instructions
                    </h2>
                    <p className="text-orange-100 text-xs mt-1">Follow these steps to complete your payment</p>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Provider Info */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        {provider.category === 'mobile_money' ? (
                          <Smartphone className="text-orange-500" size={24} />
                        ) : (
                          <Building className="text-orange-500" size={24} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Payment Provider</p>
                        <p className="font-semibold text-gray-800 text-lg">{provider.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{provider.category?.replace('_', ' ')}</p>
                      </div>
                    </div>

                    {/* Account Details */}
                    <div className="space-y-3">
                      {provider.category === 'mobile_money' && provider.account_number && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Smartphone size={12} /> Mobile Money Number
                          </p>
                          <div className="flex items-center justify-between">
                            <code className="text-xl font-mono font-bold text-gray-900">{provider.account_number}</code>
                            <button
                              onClick={() => copyToClipboard(provider.account_number!)}
                              className="p-2 hover:bg-gray-200 rounded-lg transition"
                            >
                              {copied === provider.account_number ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400" />}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {provider.category === 'bank' && (
                        <>
                          {provider.account_number && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100">
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <CreditCard size={12} /> Account Number
                              </p>
                              <div className="flex items-center justify-between">
                                <code className="text-xl font-mono font-bold text-gray-900">{provider.account_number}</code>
                                <button
                                  onClick={() => copyToClipboard(provider.account_number!)}
                                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                                >
                                  {copied === provider.account_number ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400" />}
                                </button>
                              </div>
                            </div>
                          )}
                          {provider.account_name && (
                            <div className="p-4 bg-gray-50 rounded-xl">
                              <p className="text-xs text-gray-500 mb-1">Account Name</p>
                              <p className="font-medium text-gray-800">{provider.account_name}</p>
                            </div>
                          )}
                          {provider.branch && (
                            <div className="p-4 bg-gray-50 rounded-xl">
                              <p className="text-xs text-gray-500 mb-1">Branch</p>
                              <p className="text-gray-800">{provider.branch}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Instructions */}
                    {provider.instructions && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                          <FileText size={14} /> Important Instructions
                        </p>
                        <div className="prose prose-sm max-w-none text-blue-700" dangerouslySetInnerHTML={{ __html: provider.instructions }} />
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount to Pay</span>
                        <div>
                          <span className="text-2xl font-bold text-orange-600">MWK {order.total_amount.toLocaleString()}</span>
                          {order.discount_amount > 0 && (
                            <p className="text-xs text-green-600 text-right">Includes {order.discount_amount.toLocaleString()} MWK discount</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Automatic Payment Button */}
              {provider?.type === 'automatic' && !isPaid && !isQuoteOrder && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Zap size={20} />
                      Instant Payment
                    </h2>
                    <p className="text-green-100 text-xs mt-1">Pay directly from your mobile money</p>
                  </div>
                  <div className="p-6 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone size={40} className="text-green-600" />
                    </div>
                    <p className="text-gray-600 mb-4">Click the button below to receive a payment request on your phone</p>
                    <button
                      onClick={handleRetryPayment}
                      disabled={retryingPayment}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition flex items-center justify-center gap-2"
                    >
                      {retryingPayment ? <Loader2 className="animate-spin" size={18} /> : <Smartphone size={18} />}
                      Pay with {provider.name}
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Payment Proof Card - Manual Payment Only */}
              {canUpload && !isQuoteOrder && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Upload size={18} className="text-orange-500" />
                      Upload Payment Proof
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">After making payment, upload your receipt or screenshot here</p>
                  </div>
                  <div className="p-6">
                    <form onSubmit={uploadProof} className="space-y-5">
                      {/* Drag and Drop Upload Area */}
                      {!proofFile ? (
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer
                            ${dragActive ? 'border-orange-500 bg-orange-50 scale-[1.02]' : 'border-gray-300 hover:border-orange-400 bg-gray-50 hover:bg-gray-100'}`}
                          onClick={() => document.getElementById('file-input')?.click()}
                        >
                          <Upload className={`w-10 h-10 mx-auto mb-3 transition ${dragActive ? 'text-orange-500 scale-110' : 'text-gray-400'}`} />
                          <p className="text-sm text-gray-600">Drag and drop your receipt here, or click to browse</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                          <input
                            id="file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="border rounded-xl p-4 bg-gray-50 animate-in fade-in duration-200">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              {proofPreview && (
                                <Image src={proofPreview} alt="Preview" width={64} height={64} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 truncate">{proofFile.name}</p>
                              <p className="text-xs text-gray-400">{(proofFile.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <button
                              type="button"
                              onClick={removeFile}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference (Optional)</label>
                        <input
                          type="text"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                          placeholder="e.g., TRX-123456, Reference number from your bank"
                        />
                        <p className="text-xs text-gray-400 mt-1">Helps us verify your payment faster</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                        <textarea
                          rows={2}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                          placeholder="Any extra information about your payment"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={uploading || !proofFile}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-orange-200"
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

              {/* Existing Proof Card */}
              {existing_proof && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className={`px-6 py-4 border-b border-gray-100 ${isAwaiting ? 'bg-blue-50' : 'bg-green-50'}`}>
                    <h2 className={`font-semibold flex items-center gap-2 ${isAwaiting ? 'text-blue-700' : 'text-green-700'}`}>
                      {isAwaiting ? <Clock size={18} /> : <CheckCircle size={18} />}
                      {isAwaiting ? 'Payment Under Review' : 'Payment Proof Submitted'}
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <ImageIcon className="text-gray-400" size={20} />
                      <a href={existing_proof} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline text-sm flex items-center gap-1">
                        <Eye size={14} /> View uploaded receipt
                      </a>
                    </div>
                    {existing_transaction_ref && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Transaction Reference</p>
                        <p className="text-sm font-mono font-medium text-gray-700">{existing_transaction_ref}</p>
                      </div>
                    )}
                    {existing_note && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm text-gray-600">{existing_note}</p>
                      </div>
                    )}
                    {isAwaiting && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-start gap-2 border border-blue-100">
                        <Clock size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-700">Your payment is being reviewed</p>
                          <p className="text-xs text-blue-600">We'll notify you once verified. This usually takes 24-48 hours.</p>
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

            {/* RIGHT COLUMN - Order Total Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <ReceiptText size={18} className="text-orange-500" />
                    Order Summary
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Order #{order.id.slice(-8)}</span>
                    <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>MWK {order.subtotal?.toLocaleString() || order.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>MWK {order.shipping_cost?.toLocaleString() || '0'}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>- MWK {order.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  {order.promo_code && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Tag size={12} /> Promo: {order.promo_code}
                      </span>
                      <span className="text-green-600">{order.promo_discount}% off</span>
                    </div>
                  )}
                  {order.referral_code && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Gift size={12} /> Referral: {order.referral_code}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-orange-600 text-xl">MWK {order.total_amount.toLocaleString()}</span>
                  </div>

                  {/* Payment Status Badge */}
                  <div className={`mt-4 p-3 rounded-xl text-center ${
                    isPaid ? 'bg-green-50' : isAwaiting ? 'bg-blue-50' : isQuoteOrder ? 'bg-indigo-50' : 'bg-yellow-50'
                  }`}>
                    <div className={`flex items-center justify-center gap-2 ${
                      isPaid ? 'text-green-700' : isAwaiting ? 'text-blue-700' : isQuoteOrder ? 'text-indigo-700' : 'text-yellow-700'
                    }`}>
                      {isPaid ? <CheckCircle size={16} /> : isAwaiting ? <Clock size={16} /> : isQuoteOrder ? <Send size={16} /> : <AlertCircle size={16} />}
                      <span className="font-medium text-sm">
                        {isPaid ? 'Payment Confirmed' : isAwaiting ? 'Awaiting Verification' : isQuoteOrder ? 'Delivery Quote Ready' : 'Payment Pending'}
                      </span>
                    </div>
                    {isAwaiting && <p className="text-xs text-blue-600 mt-1">Verification within 24 hours</p>}
                  </div>

                  {/* Security Badges */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Lock size={12} className="text-green-600" />
                        SSL Secure
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-300" />
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Shield size={12} className="text-green-600" />
                        Buyer Protection
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-300" />
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <FileCheck size={12} className="text-green-600" />
                        Verified Payment
                      </div>
                    </div>
                  </div>

                  {/* Help Section */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">Need help with payment?</p>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <button
                        onClick={() => router.push('/contact')}
                        className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 transition"
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

              {/* Tip Card */}
              <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <Sparkles size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">Payment Tips</p>
                    <p className="text-xs text-amber-700 mt-1">
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
