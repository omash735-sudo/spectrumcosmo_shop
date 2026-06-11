'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, CheckCircle2, XCircle, Package, Truck, 
  Clock, Shield, Heart, ArrowRight, Mail, Phone,
  Calendar, MapPin, DollarSign, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfirmDeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'received' | 'not_received' | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/account/orders/${orderId}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        toast.error('Failed to load order');
        router.push('/account/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, router]);

  const handleConfirm = async () => {
    if (!selectedOption) {
      toast.error('Please select an option');
      return;
    }
    
    setConfirming(true);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type':application/json' },
        body: JSON.stringify({ response: selectedOption }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.message);
      
      if (selectedOption === 'received') {
        router.push('/products?confirmed=true');
      } else {
        router.push('/support');
      }
    } catch (err: any) {
      toast.error(err.message);
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusColor = order.status === 'delivered' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400';
  const statusBg = order.status === 'delivered' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-orange-50 dark:bg-orange-950/30';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
      <div className="max-w-2xl w-full">
        {/* Header Card */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
            <Package size={32} className="text-orange-500 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Confirm Delivery</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-1 sm:mt-2">Help us improve by confirming your delivery</p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-5 sm:mb-6">
          <div className="bg-gradient-to-r from-orange-50 to-white dark:from-gray-800 dark:to-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Package size={16} className="text-orange-500 sm:w-[18px] sm:h-[18px]" />
                <h2 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">Order Summary</h2>
              </div>
              <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${statusColor} ${statusBg}`}>
                <CheckCircle2 size={10} className="sm:w-3 sm:h-3" />
                {order.status}
              </span>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Order Number</span>
              <span className="font-mono text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                #{order.order_number?.slice(-8) || order.id.slice(-8)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Order Date</span>
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Total Amount</span>
              <span className="text-base sm:text-xl font-bold text-orange-600 dark:text-orange-400">MWK {order.total_amount?.toLocaleString()}</span>
            </div>
            <div className="border-t dark:border-gray-700 pt-3 sm:pt-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Truck size={12} className="text-gray-500 dark:text-gray-400 sm:w-3.5 sm:h-3.5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white">Delivery Status</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {order.status === 'delivered' 
                      ? 'Your order has been marked as delivered' 
                      : 'Your order is on its way'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Options */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-5 sm:mb-6">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h2 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
              <Sparkles size={16} className="text-orange-500 sm:w-[18px] sm:h-[18px]" />
              Delivery Confirmation
            </h2>
          </div>
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              Did you receive your order? Your confirmation helps us improve our service.
            </p>
            
            {/* Option 1 - Received */}
            <label
              className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedOption === 'received'
                  ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="confirmation"
                checked={selectedOption === 'received'}
                onChange={() => setSelectedOption('received')}
                className="mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 size={14} className="text-green-500 sm:w-[18px] sm:h-[18px]" />
                  <span className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">Yes, I received my order</span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Confirm that you have received your order in good condition
                </p>
              </div>
            </label>

            {/* Option 2 - Not Received */}
            <label
              className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedOption === 'not_received'
                  ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="confirmation"
                checked={selectedOption === 'not_received'}
                onChange={() => setSelectedOption('not_received')}
                className="mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 focus:ring-red-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <XCircle size={14} className="text-red-500 sm:w-[18px] sm:h-[18px]" />
                  <span className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">No, I did not receive my order</span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  We'll help you resolve this issue and track your order
                </p>
              </div>
            </label>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={confirming || !selectedOption}
              className="w-full mt-3 sm:mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 sm:py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-orange-200 dark:shadow-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
            >
              {confirming ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Submit Confirmation
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center">
          <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mb-1 sm:mb-2">Need help with your order?</p>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <Link href="/contact" className="text-[10px] sm:text-xs text-orange-500 hover:text-orange-600 flex items-center gap-0.5 sm:gap-1">
              <Mail size={10} className="sm:w-3 sm:h-3" /> Contact Support
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link href="/faq" className="text-[10px] sm:text-xs text-orange-500 hover:text-orange-600 flex items-center gap-0.5 sm:gap-1">
              <HelpCircle size={10} className="sm:w-3 sm:h-3" /> FAQ
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-5 sm:mt-6">
          <Link href="/account/orders" className="inline-flex items-center gap-0.5 sm:gap-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xs sm:text-sm transition">
            ← Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper component for HelpCircle icon
function HelpCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
