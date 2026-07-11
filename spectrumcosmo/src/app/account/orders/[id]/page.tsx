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
  pending: { label: 'Order Placed', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30', icon: Clock, step: 1 },
  processing: { label: 'Processing', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: Package, step: 2 },
  shipped: { label: 'Shipped', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', icon: Truck, step: 3 },
  delivered: { label: 'Delivered', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', icon: CheckCircle2, step: 4 },
  cancelled: { label: 'Cancelled', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', icon: XCircle, step: 0 },
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
          <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3" />
          <p className="text-[var(--foreground-muted)] text-sm sm:text-base">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <AlertCircle size={28} className="text-red-500 sm:w-8 sm:h-8" />
          </div>
          <p className="text-[var(--foreground-muted)] text-sm sm:text-base">Order not found</p>
          <Link href="/account/orders" className="mt-3 sm:mt-4 inline-block text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm">
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
    <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
      
      {/* Header - With Manga Panel */}
      <div className="manga-bg hero-manga rounded-xl sm:rounded-2xl overflow-hidden mb-5 sm:mb-6">
        <div className="relative z-10 p-4 sm:p-5 md:p-6 bg-[var(--background-card)]/95">
          <Link href="/account/orders" className="inline-flex items-center gap-0.5 sm:gap-1 text-[var(--foreground-muted)] hover:text-[var(--primary)] text-xs sm:text-sm mb-3 sm:mb-4 transition group">
            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition sm:w-3.5 sm:h-3.5" />
            Back to Orders
          </Link>
          <div className="flex flex-wrap justify-between items-start gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)]">Order Details</h1>
              <p className="text-[var(--foreground-muted)] text-xs sm:text-sm mt-0.5 sm:mt-1">
                Order #{order.order_number || order.id.slice(-8)}
              </p>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 border border-[var(--border)] rounded-xl text-xs sm:text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition"
              >
                <Printer size={12} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`${currentStatus.bg} rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 border border-${currentStatus.color.split('-')[1]}-100 dark:border-${currentStatus.color.split('-')[1]}-800`}>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--background-card)] shadow-sm flex items-center justify-center border border-[var(--border)]">
            <CurrentIcon size={20} className={`${currentStatus.color} sm:w-6 sm:h-6`} />
          </div>
          <div>
            <h2 className={`font-bold text-base sm:text-lg ${currentStatus.color}`}>{currentStatus.label}</h2>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
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
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
        {order.status === 'shipped' && order.tracking_number && (
          <Link
            href={`/account/orders/${orderId}/tracking`}
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-[var(--primary)] text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition shadow-sm"
          >
            <Truck size={14} className="sm:w-[18px] sm:h-[18px]" />
            Track Order
          </Link>
        )}
        {showConfirmButton && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-green-500 text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm hover:bg-green-600 transition shadow-sm"
          >
            <CheckCircle2 size={14} className="sm:w-[18px] sm:h-[18px]" />
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
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-red-500 text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm hover:bg-red-600 transition shadow-sm"
          >
            <XCircle size={14} className="sm:w-[18px] sm:h-[18px]" />
            Cancel Order
          </button>
        )}
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 border border-[var(--border)] rounded-xl font-medium text-xs sm:text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition"
        >
          <ShoppingBag size={14} className="sm:w-[18px] sm:h-[18px]" />
          Shop Again
        </Link>
      </div>

      {/* Order Info Grid */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Order Information */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--foreground)] mb-2.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
            <Package size={14} className="text-[var(--primary)] sm:w-4 sm:h-4" />
            Order Information
          </h3>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between flex-wrap gap-1">
              <span className="text-[var(--foreground-muted)]">Order Date</span>
              <span className="text-[var(--foreground)]">{new Date(order.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between flex-wrap gap-1">
              <span className="text-[var(--foreground-muted)]">Payment Method</span>
              <span className="text-[var(--foreground)]">{order.payment_method || 'Cash on Delivery'}</span>
            </div>
            <div className="flex justify-between items-center flex-wrap gap-1">
              <span className="text-[var(--foreground-muted)]">Payment Status</span>
              <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                order.payment_status === 'paid' 
                  ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                  : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
              }`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
            {order.promo_code && (
              <div className="flex justify-between flex-wrap gap-1">
                <span className="text-[var(--foreground-muted)]">Promo Code</span>
                <span className="text-green-600 dark:text-green-400 font-mono text-[10px] sm:text-xs">{order.promo_code}</span>
              </div>
            )}
            {order.tracking_number && (
              <div className="flex justify-between flex-wrap gap-1">
                <span className="text-[var(--foreground-muted)]">Tracking Number</span>
                <span className="font-mono text-[10px] sm:text-xs text-[var(--foreground)]">{order.tracking_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--foreground)] mb-2.5 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
            <Truck size={14} className="text-[var(--primary)] sm:w-4 sm:h-4" />
            Delivery Information
          </h3>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <div className="flex gap-2">
              <User size={12} className="text-[var(--foreground-muted)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[var(--foreground)]">{order.customer_name}</p>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] break-all">{order.customer_email}</p>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">{order.phone_number}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <MapPin size={12} className="text-[var(--foreground-muted)] mt-0.5 flex-shrink-0" />
              <p className="text-[var(--foreground)] break-words">{order.delivery_address}</p>
            </div>
            {order.tracking_notes && (
              <div className="mt-2 p-2 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)]">
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Courier Note:</p>
                <p className="text-[10px] sm:text-xs text-[var(--foreground)]">{order.tracking_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden mb-6 sm:mb-8 shadow-sm">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
            <ShoppingBag size={14} className="text-[var(--primary)] sm:w-4 sm:h-4" />
            Order Items ({order.items?.length || 0})
          </h3>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {order.items?.map((item, idx) => (
            <div key={idx} className="p-3 sm:p-4 flex gap-2.5 sm:gap-4 hover:bg-[var(--background-secondary)] transition">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-xl overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.product_name} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={18} className="text-[var(--foreground-muted)] sm:w-6 sm:h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--foreground)] text-xs sm:text-sm break-words">{item.product_name}</p>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Qty: {item.quantity}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-[var(--foreground)] text-xs sm:text-sm">MWK {item.total_price?.toLocaleString()}</p>
                <p className="text-[9px] sm:text-xs text-[var(--foreground-muted)]">MWK {item.unit_price?.toLocaleString()} each</p>
              </div>
            </div>
          ))}
          <div className="p-3 sm:p-4 bg-[var(--background-secondary)]">
            <div className="space-y-1.5 sm:space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-[var(--foreground-muted)]">Subtotal</span>
                <span className="text-[var(--foreground)]">MWK {order.subtotal?.toLocaleString() || order.total_amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-[var(--foreground-muted)]">Shipping</span>
                <span className="text-[var(--foreground)]">MWK {order.shipping_cost?.toLocaleString() || '0'}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>- MWK {order.discount_amount?.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-[var(--border)] pt-1.5 sm:pt-2 flex justify-between font-bold">
                <span className="text-[var(--foreground)] text-sm sm:text-base">Total</span>
                <span className="text-[var(--primary)] text-base sm:text-lg">MWK {order.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Timeline - With Manga Panel */}
      {history.length > 0 && (
        <div className="manga-bg cards-manga rounded-xl border border-[var(--border)] overflow-hidden mb-6 sm:mb-8 shadow-sm">
          <div className="relative z-10 bg-[var(--background-card)] p-4 sm:p-5">
            <h3 className="font-semibold text-[var(--foreground)] mb-4 sm:mb-5 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <Clock size={14} className="text-[var(--primary)] sm:w-4 sm:h-4" />
              Order Timeline
            </h3>
            <div className="relative">
              <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-0.5 bg-[var(--border)]"></div>
              <div className="space-y-4 sm:space-y-6">
                {history.map((event, idx) => (
                  <div key={event.id} className="relative flex gap-3 sm:gap-4">
                    <div className="relative z-10">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                        event.color === 'green' ? 'bg-green-100 dark:bg-green-950/30' : 
                        event.color === 'orange' ? 'bg-[var(--primary)]/10' : 
                        'bg-[var(--background-secondary)]'
                      }`}>
                        {event.new_status === 'delivered' ? (
                          <CheckCircle2 size={12} className="text-green-600 dark:text-green-400 sm:w-4 sm:h-4" />
                        ) : event.new_status === 'shipped' ? (
                          <Truck size={12} className="text-purple-600 dark:text-purple-400 sm:w-4 sm:h-4" />
                        ) : (
                          <Package size={12} className="text-[var(--primary)] sm:w-4 sm:h-4" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="font-semibold text-[var(--foreground)] text-xs sm:text-sm">{event.status_name || event.new_status}</p>
                      <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">{new Date(event.changed_at).toLocaleString()}</p>
                      {event.notes && <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5 sm:mt-1">{event.notes}</p>}
                      <p className="text-[9px] sm:text-xs text-[var(--foreground-muted)] mt-0.5">by {event.changed_by}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notes */}
      {order.admin_notes && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-xl border border-yellow-200 dark:border-yellow-800 p-3 sm:p-4 mb-6 sm:mb-8">
          <div className="flex items-start gap-1.5 sm:gap-2">
            <MessageCircle size={14} className="text-yellow-600 dark:text-yellow-400 mt-0.5 sm:w-4 sm:h-4" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-400">Note from Admin</p>
              <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-500">{order.admin_notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-[var(--background-secondary)] rounded-xl p-4 sm:p-5 text-center border border-[var(--border)]">
        <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-1 sm:mb-2">Need Help With Your Order?</h3>
        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mb-3 sm:mb-4">Our support team is here to assist you</p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--primary)] text-white rounded-lg text-[10px] sm:text-sm font-medium hover:bg-[var(--primary-hover)] transition"
          >
            <MessageCircle size={12} className="sm:w-3.5 sm:h-3.5" />
            Contact Support
          </Link>
          <Link
            href="/faq"
            className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-[var(--border)] rounded-lg text-[10px] sm:text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-card)] transition"
          >
            <HelpCircle size={12} className="sm:w-3.5 sm:h-3.5" />
            View FAQ
          </Link>
        </div>
      </div>

      {/* Confirm Delivery Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-[var(--border)]">
            <div className="text-center mb-3 sm:mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <CheckCircle2 size={24} className="text-green-600 dark:text-green-400 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">Confirm Delivery</h2>
              <p className="text-[var(--foreground-muted)] text-xs sm:text-sm mt-0.5 sm:mt-1">Did you receive your order?</p>
            </div>
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => handleConfirmDelivery('received')}
                disabled={confirming}
                className="flex-1 bg-green-500 text-white py-2 sm:py-3 rounded-xl font-medium text-sm hover:bg-green-600 transition disabled:opacity-50"
              >
                {confirming ? <Loader2 className="animate-spin inline mr-1 sm:mr-2" size={14} /> : <CheckCircle2 size={14} className="inline mr-1 sm:mr-2" />}
                Yes, Received
              </button>
              <button
                onClick={() => handleConfirmDelivery('not_received')}
                disabled={confirming}
                className="flex-1 bg-red-500 text-white py-2 sm:py-3 rounded-xl font-medium text-sm hover:bg-red-600 transition disabled:opacity-50"
              >
                <XCircle size={14} className="inline mr-1 sm:mr-2" />
                Not Received
              </button>
            </div>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="w-full mt-2 sm:mt-3 text-[var(--foreground-muted)] text-xs sm:text-sm py-1.5 sm:py-2 hover:text-[var(--foreground)] transition"
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
