'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, Truck, Package, Clock, CheckCircle2, XCircle, 
  AlertCircle, Download, Eye, MapPin, Phone, Calendar, 
  DollarSign, CreditCard, ShoppingBag, Heart, Shield,
  ChevronRight, ArrowLeft, Printer, MessageCircle, Star,
  TrendingUp, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  delivery_address: string;
  total_amount: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  paid_at: string | null;
  tracking_number: string | null;
  tracking_notes: string | null;
  admin_notes: string | null;
  delivered_at: string | null;
  promo_code: string | null;
  referral_code: string | null;
  items: Array<{ 
    product_name: string; 
    quantity: number; 
    unit_price: number; 
    total_price: number;
    image_url?: string;
  }>;
}

interface StatusHistory {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  notes: string;
  changed_at: string;
  status_name: string;
  color: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any; step: number }> = {
  pending: { label: 'Order Placed', color: 'text-yellow-700', bg: 'bg-yellow-50', icon: Clock, step: 1 },
  processing: { label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-50', icon: Package, step: 2 },
  shipped: { label: 'Shipped', color: 'text-purple-700', bg: 'bg-purple-50', icon: Truck, step: 3 },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle2, step: 4 },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle, step: 0 },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await fetch(`/api/account/orders/${orderId}`);
        if (!res.ok) throw new Error('Failed to load order');
        const data = await res.json();
        setOrder(data.order);
        setHistory(data.history || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`);
      if (!res.ok) throw new Error('Failed to generate invoice');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Invoice downloaded');
    } catch (err) {
      toast.error('Failed to download invoice');
    }
  };

  const handleConfirmDelivery = async (response: 'received' | 'not_received') => {
    setConfirming(true);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.message);
      setShowConfirmModal(false);
      
      if (data.redirectTo) {
        router.push(data.redirectTo);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
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

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Order not found</p>
          <Link href="/account/orders" className="mt-4 inline-block text-orange-500 hover:underline">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = statusConfig[order.status] || statusConfig.pending;
  const CurrentIcon = currentStatus.icon;
  const showConfirmButton = order.status === 'delivered' && !order.delivered_at;
  const canCancel = order.status === 'pending';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/account/orders" className="inline-flex items-center gap-1 text-gray-500 hover:text-orange-500 text-sm mb-4 transition group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition" />
          Back to Orders
        </Link>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-500 text-sm mt-1">
              Order #{order.order_number || order.id.slice(-8)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadInvoice}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <Printer size={16} />
              Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`${currentStatus.bg} rounded-2xl p-5 mb-8 border border-${currentStatus.color.split('-')[1]}-100`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
            <CurrentIcon size={24} className={currentStatus.color} />
          </div>
          <div>
            <h2 className={`font-bold text-lg ${currentStatus.color}`}>{currentStatus.label}</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {order.status === 'delivered' 
                ? `Your order was delivered on ${new Date(order.delivered_at || order.created_at).toLocaleDateString()}`
                : order.status === 'shipped'
                ? `Your order is on its way! Track it with number: ${order.tracking_number || 'N/A'}`
                : `Your order has been ${order.status} and is being processed`}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {order.status === 'shipped' && order.tracking_number && (
          <Link
            href={`/account/orders/${orderId}/tracking`}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition shadow-sm"
          >
            <Truck size={18} />
            Track Order
          </Link>
        )}
        {showConfirmButton && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-600 transition shadow-sm"
          >
            <CheckCircle2 size={18} />
            Confirm Delivery
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to cancel this order?')) {
                // Handle cancellation
              }
            }}
            className="inline-flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-red-600 transition shadow-sm"
          >
            <XCircle size={18} />
            Cancel Order
          </button>
        )}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <ShoppingBag size={18} />
          Shop Again
        </Link>
      </div>

      {/* Order Info Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Order Information */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Package size={16} className="text-orange-500" />
            Order Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Order Date</span>
              <span className="text-gray-700">{new Date(order.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method</span>
              <span className="text-gray-700">{order.payment_method || 'Cash on Delivery'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Status</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
            {order.promo_code && (
              <div className="flex justify-between">
                <span className="text-gray-500">Promo Code</span>
                <span className="text-green-600 font-mono text-xs">{order.promo_code}</span>
              </div>
            )}
            {order.referral_code && (
              <div className="flex justify-between">
                <span className="text-gray-500">Referral Code</span>
              </div>
            )}
            {order.tracking_number && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tracking Number</span>
                <span className="font-mono text-xs text-gray-600">{order.tracking_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Truck size={16} className="text-orange-500" />
            Delivery Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <User size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-700">{order.customer_name}</p>
                <p className="text-xs text-gray-400">{order.customer_email}</p>
                <p className="text-xs text-gray-400">{order.phone_number}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">{order.delivery_address}</p>
            </div>
            {order.tracking_notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Courier Note:</p>
                <p className="text-xs text-gray-600">{order.tracking_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingBag size={16} className="text-orange-500" />
            Order Items ({order.items?.length || 0})
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item, idx) => (
            <div key={idx} className="p-4 flex gap-4 hover:bg-gray-50 transition">
              <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.product_name} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={24} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.product_name}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">MWK {item.total_price?.toLocaleString()}</p>
                <p className="text-xs text-gray-400">MWK {item.unit_price?.toLocaleString()} each</p>
              </div>
            </div>
          ))}
          <div className="p-4 bg-gray-50">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">MWK {order.subtotal?.toLocaleString() || order.total_amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-700">MWK {order.shipping_cost?.toLocaleString() || '0'}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>- MWK {order.discount_amount?.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-orange-600 text-lg">MWK {order.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <Clock size={16} className="text-orange-500" />
            Order Timeline
          </h3>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-6">
              {history.map((event, idx) => (
                <div key={event.id} className="relative flex gap-4">
                  <div className="relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.color === 'green' ? 'bg-green-100' : event.color === 'orange' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                      {event.new_status === 'delivered' ? (
                        <CheckCircle2 size={16} className="text-green-600" />
                      ) : event.new_status === 'shipped' ? (
                        <Truck size={16} className="text-purple-600" />
                      ) : (
                        <Package size={16} className="text-orange-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="font-semibold text-gray-800">{event.status_name || event.new_status}</p>
                    <p className="text-xs text-gray-400">{new Date(event.changed_at).toLocaleString()}</p>
                    {event.notes && <p className="text-sm text-gray-500 mt-1">{event.notes}</p>}
                    <p className="text-xs text-gray-400 mt-1">by {event.changed_by}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Notes */}
      {order.admin_notes && (
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 mb-8">
          <div className="flex items-start gap-2">
            <MessageCircle size={16} className="text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Note from Admin</p>
              <p className="text-sm text-yellow-700">{order.admin_notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 text-center">
        <h3 className="font-semibold text-gray-800 mb-2">Need Help With Your Order?</h3>
        <p className="text-sm text-gray-500 mb-3">Our support team is here to assist you</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
          >
            <MessageCircle size={14} />
            Contact Support
          </Link>
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <HelpCircle size={14} />
            View FAQ
          </Link>
        </div>
      </div>

      {/* Confirm Delivery Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Delivery</h2>
              <p className="text-gray-500 text-sm mt-1">Did you receive your order?</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleConfirmDelivery('received')}
                disabled={confirming}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition disabled:opacity-50"
              >
                {confirming ? <Loader2 className="animate-spin inline" size={16} /> : <CheckCircle2 size={16} className="inline mr-2" />}
                Yes, Received
              </button>
              <button
                onClick={() => handleConfirmDelivery('not_received')}
                disabled={confirming}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                <XCircle size={16} className="inline mr-2" />
                Not Received
              </button>
            </div>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="w-full mt-3 text-gray-500 text-sm py-2 hover:text-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
function User(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function HelpCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
