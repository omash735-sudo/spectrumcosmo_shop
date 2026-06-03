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
        headers: { 'Content-Type': 'application/json' },
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
          <Loader2 className="animate-spin text-orange-500 w-10 h-10 mx-auto mb-3" />
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusColor = order.status === 'delivered' ? 'text-green-600' : 'text-orange-600';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-2xl w-full">
        {/* Header Card */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Package size={40} className="text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Confirm Delivery</h1>
          <p className="text-gray-500 mt-2">Help us improve by confirming your delivery</p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-orange-50 to-white px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-orange-500" />
                <h2 className="font-semibold text-gray-800">Order Summary</h2>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor} bg-${order.status === 'delivered' ? 'green' : 'orange'}-50`}>
                <CheckCircle2 size={12} />
                {order.status}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Order Number</span>
              <span className="font-mono text-sm font-medium text-gray-900">
                #{order.order_number?.slice(-8) || order.id.slice(-8)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Order Date</span>
              <span className="text-sm text-gray-700">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Total Amount</span>
              <span className="text-xl font-bold text-orange-600">MWK {order.total_amount?.toLocaleString()}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Truck size={14} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Delivery Status</p>
                  <p className="text-xs text-gray-500">
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Sparkles size={18} className="text-orange-500" />
              Delivery Confirmation
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-gray-600 text-sm">
              Did you receive your order? Your confirmation helps us improve our service.
            </p>
            
            {/* Option 1 - Received */}
            <label
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedOption === 'received'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="confirmation"
                checked={selectedOption === 'received'}
                onChange={() => setSelectedOption('received')}
                className="mt-0.5 w-4 h-4 text-green-500 focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span className="font-semibold text-gray-800">Yes, I received my order</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Confirm that you have received your order in good condition
                </p>
              </div>
            </label>

            {/* Option 2 - Not Received */}
            <label
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedOption === 'not_received'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="confirmation"
                checked={selectedOption === 'not_received'}
                onChange={() => setSelectedOption('not_received')}
                className="mt-0.5 w-4 h-4 text-red-500 focus:ring-red-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <XCircle size={18} className="text-red-500" />
                  <span className="font-semibold text-gray-800">No, I did not receive my order</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We'll help you resolve this issue and track your order
                </p>
              </div>
            </label>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={confirming || !selectedOption}
              className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {confirming ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Submit Confirmation
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-2">Need help with your order?</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/contact" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1">
              <Mail size={12} /> Contact Support
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/faq" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1">
              <HelpCircle size={12} /> FAQ
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/account/orders" className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm transition">
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
