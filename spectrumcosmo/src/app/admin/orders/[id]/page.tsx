'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Loader2,
  ArrowLeft,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Printer,
  Copy,
  CheckCheck,
  Banknote,
  CreditCard,
  Edit,
  Save,
  X,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price_usd: number;
  custom_details?: string;
}

interface Order {
  id: string;
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  payment_method: string;
  total_amount: number;
  status: string;
  created_at: string;
  proof_of_payment_url: string | null;
  payment_note: string | null;
  items: OrderItem[];
  order_number?: string;
  customer_email?: string;
  tracking_number?: string | null;
  tracking_notes?: string | null;
  admin_notes?: string | null;
  custom_delivery_method?: string | null;
  promo_code?: string | null;
  discount_amount?: number;
  tax_amount?: number;
  payment_status?: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { 
    label: 'Pending', 
    color: 'text-yellow-700 dark:text-yellow-400', 
    bg: 'bg-yellow-100 dark:bg-yellow-950/30',
    icon: Clock
  },
  processing: { 
    label: 'Processing', 
    color: 'text-blue-700 dark:text-blue-400', 
    bg: 'bg-blue-100 dark:bg-blue-950/30',
    icon: Loader2
  },
  shipped: { 
    label: 'Shipped', 
    color: 'text-purple-700 dark:text-purple-400', 
    bg: 'bg-purple-100 dark:bg-purple-950/30',
    icon: Truck
  },
  delivered: { 
    label: 'Delivered', 
    color: 'text-green-700 dark:text-green-400', 
    bg: 'bg-green-100 dark:bg-green-950/30',
    icon: CheckCircle2
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'text-red-700 dark:text-red-400', 
    bg: 'bg-red-100 dark:bg-red-950/30',
    icon: AlertCircle
  },
  awaiting_verification: { 
    label: 'Awaiting Verification', 
    color: 'text-orange-700 dark:text-orange-400', 
    bg: 'bg-orange-100 dark:bg-orange-950/30',
    icon: Clock
  },
};

const paymentStatusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { 
    label: 'Pending', 
    color: 'text-yellow-700 dark:text-yellow-400', 
    bg: 'bg-yellow-100 dark:bg-yellow-950/30',
    icon: Clock
  },
  awaiting_verification: { 
    label: 'Awaiting Verification', 
    color: 'text-orange-700 dark:text-orange-400', 
    bg: 'bg-orange-100 dark:bg-orange-950/30',
    icon: AlertCircle
  },
  paid: { 
    label: 'Paid', 
    color: 'text-green-700 dark:text-green-400', 
    bg: 'bg-green-100 dark:bg-green-950/30',
    icon: CheckCircle2
  },
  failed: { 
    label: 'Failed', 
    color: 'text-red-700 dark:text-red-400', 
    bg: 'bg-red-100 dark:bg-red-950/30',
    icon: AlertCircle
  },
};

// ===== SKELETON =====
function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-4 bg-[var(--background-secondary)] rounded w-24 mb-2" />
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-32 mt-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-[var(--background-secondary)] rounded w-32" />
          <div className="h-10 bg-[var(--background-secondary)] rounded w-10" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--background-secondary)] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-[var(--background-secondary)] rounded-xl" />
          <div className="h-64 bg-[var(--background-secondary)] rounded-xl" />
        </div>
        <div className="space-y-6">
          <div className="h-32 bg-[var(--background-secondary)] rounded-xl" />
          <div className="h-40 bg-[var(--background-secondary)] rounded-xl" />
          <div className="h-32 bg-[var(--background-secondary)] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch order');
      const data = await res.json();
      setOrder(data);
      setAdminNotes(data.admin_notes || '');
      setNewStatus(data.status || 'pending');
    } catch (err) {
      console.error('Failed to fetch order:', err);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: orderId, 
          status: newStatus,
          adminNotes: adminNotes 
        }),
      });
      if (!res.ok) throw new Error('Failed to update order');
      toast.success('Order status updated successfully');
      setEditingStatus(false);
      await fetchOrder();
    } catch (err) {
      console.error('Failed to update order:', err);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const updateAdminNotes = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: orderId, 
          adminNotes: adminNotes 
        }),
      });
      if (!res.ok) throw new Error('Failed to update notes');
      toast.success('Admin notes updated successfully');
      setEditingNotes(false);
      await fetchOrder();
    } catch (err) {
      console.error('Failed to update notes:', err);
      toast.error('Failed to update admin notes');
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-MW', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatCurrency = (amount: number) => {
    return `MWK ${Number(amount || 0).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <OrderDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="text-[var(--foreground-muted)] opacity-30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Order not found</h2>
          <p className="text-sm text-[var(--foreground-muted)] mt-2">This order may have been deleted</p>
          <Link href="/admin/orders" className="inline-block mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium">
            Back to orders →
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = statusMap[order.status] || statusMap.pending;
  const paymentInfo = paymentStatusMap[order.payment_status || 'pending'] || paymentStatusMap.pending;
  const StatusIcon = statusInfo.icon;
  const PaymentIcon = paymentInfo.icon;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition mb-1.5"
            >
              <ArrowLeft size={16} />
              Back to Orders
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                Order #{order.order_number || order.id.slice(-8).toUpperCase()}
              </h1>
              <button
                onClick={() => copyToClipboard(order.id)}
                className="p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)] min-h-[32px] min-w-[32px] flex items-center justify-center"
                title="Copy order ID"
              >
                {copied ? <CheckCheck size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/orders/${orderId}/receipt`}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition text-sm font-medium min-h-[40px]"
            >
              <Upload size={16} />
              Upload Receipt
            </Link>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--background-secondary)] transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Printer size={18} className="text-[var(--foreground-muted)]" />
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Package size={14} className="text-[var(--foreground-muted)]" />
              <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Order Status</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color} text-xs sm:text-sm`}>
              <StatusIcon size={12} className="sm:w-3.5 sm:h-3.5" />
              <span className="font-medium">{statusInfo.label}</span>
            </div>
          </div>

          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Banknote size={14} className="text-[var(--foreground-muted)]" />
              <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Payment Status</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full ${paymentInfo.bg} ${paymentInfo.color} text-xs sm:text-sm`}>
              <PaymentIcon size={12} className="sm:w-3.5 sm:h-3.5" />
              <span className="font-medium">{paymentInfo.label}</span>
            </div>
          </div>

          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-[var(--foreground-muted)]" />
              <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Amount</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
              {formatCurrency(order.total_amount)}
            </p>
          </div>

          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Truck size={14} className="text-[var(--foreground-muted)]" />
              <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Delivery Method</span>
            </div>
            <p className="text-sm font-medium text-[var(--foreground)] truncate">
              {order.custom_delivery_method || 'Standard'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Customer Information */}
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm">
              <h2 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                <User size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--primary)]" />
                Customer Information
              </h2>
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-start gap-3">
                  <User size={14} className="text-[var(--foreground-muted)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={14} className="text-[var(--foreground-muted)] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--foreground-muted)] break-all">{order.customer_email || 'N/A'}</p>
                    {order.customer_email && (
                      <button
                        onClick={() => copyToClipboard(order.customer_email!)}
                        className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
                      >
                        Copy email
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={14} className="text-[var(--foreground-muted)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">{order.phone_number}</p>
                    <button
                      onClick={() => copyToClipboard(order.phone_number)}
                      className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
                    >
                      Copy phone
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-[var(--foreground-muted)] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[var(--foreground-muted)] break-words">{order.delivery_address}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm">
              <h2 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                <Package size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--primary)]" />
                Order Items ({order.items?.length || 0})
              </h2>
              <div className="space-y-3">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 sm:py-3 border-b border-[var(--border)] last:border-0 gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {item.product_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)]">
                          <span>Qty: {item.quantity}</span>
                          <span>× {formatCurrency(item.unit_price_usd)}</span>
                          {item.custom_details && (
                            <span className="text-[var(--foreground-muted)] opacity-70">
                              • {item.custom_details}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-[var(--foreground)] whitespace-nowrap">
                        {formatCurrency(item.quantity * item.unit_price_usd)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--foreground-muted)] text-center py-4">No items found</p>
                )}
              </div>

              {/* Order Summary */}
              <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">Subtotal</span>
                  <span className="text-[var(--foreground)]">
                    {formatCurrency(order.total_amount + (order.discount_amount || 0) - (order.tax_amount || 0))}
                  </span>
                </div>
                {order.discount_amount && order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">Discount</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(order.discount_amount)}
                    </span>
                  </div>
                )}
                {order.tax_amount && order.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">Tax</span>
                    <span className="text-[var(--foreground)]">
                      {formatCurrency(order.tax_amount)}
                    </span>
                  </div>
                )}
                {order.promo_code && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">Promo Code</span>
                    <span className="text-[var(--primary)] font-medium">{order.promo_code}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-[var(--border)]">
                  <span className="text-[var(--foreground)]">Total</span>
                  <span className="text-[var(--primary)]">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Order Status Update */}
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm">
              <h2 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                <Edit size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--primary)]" />
                Update Status
              </h2>
              {editingStatus ? (
                <div className="space-y-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                  >
                    {Object.keys(statusMap).map((status) => (
                      <option key={status} value={status}>
                        {statusMap[status].label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={updateOrderStatus}
                      disabled={updating}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition text-sm font-medium disabled:opacity-50 min-h-[40px]"
                    >
                      {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {updating ? 'Saving...' : 'Save Status'}
                    </button>
                    <button
                      onClick={() => setEditingStatus(false)}
                      className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition min-h-[40px] flex items-center justify-center"
                    >
                      <X size={16} className="text-[var(--foreground-muted)]" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color} text-xs sm:text-sm`}>
                    <StatusIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="font-medium">{statusInfo.label}</span>
                  </div>
                  <button
                    onClick={() => setEditingStatus(true)}
                    className="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm">
              <h2 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                <CreditCard size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--primary)]" />
                Payment Details
              </h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--foreground-muted)]">Method</span>
                  <span className="text-[var(--foreground)] font-medium">
                    {order.payment_method || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--foreground-muted)]">Status</span>
                  <span className={`font-medium ${paymentInfo.color}`}>
                    {paymentInfo.label}
                  </span>
                </div>
                {order.payment_note && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)]">
                    <p className="text-[10px] text-[var(--foreground-muted)]">Note:</p>
                    <p className="text-sm text-[var(--foreground-muted)]">{order.payment_note}</p>
                  </div>
                )}
                {order.proof_of_payment_url && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)]">
                    <p className="text-[10px] text-[var(--foreground-muted)] mb-1.5">Payment Proof:</p>
                    <a
                      href={order.proof_of_payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
                    >
                      <FileText size={14} />
                      View Proof
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm">
              <h2 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                <FileText size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--primary)]" />
                Admin Notes
              </h2>
              {editingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition resize-none"
                    placeholder="Add internal admin notes here..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={updateAdminNotes}
                      disabled={updating}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition text-sm font-medium disabled:opacity-50 min-h-[40px]"
                    >
                      {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {updating ? 'Saving...' : 'Save Notes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotes(false);
                        setAdminNotes(order.admin_notes || '');
                      }}
                      className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition min-h-[40px] flex items-center justify-center"
                    >
                      <X size={16} className="text-[var(--foreground-muted)]" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {order.admin_notes ? (
                    <p className="text-sm text-[var(--foreground-muted)] whitespace-pre-wrap">{order.admin_notes}</p>
                  ) : (
                    <p className="text-sm text-[var(--foreground-muted)] italic">No admin notes</p>
                  )}
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="mt-3 text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
                  >
                    {order.admin_notes ? 'Edit Notes' : 'Add Notes'}
                  </button>
                </div>
              )}
            </div>

            {/* Order Meta */}
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm">
              <h2 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                <Calendar size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--primary)]" />
                Order Details
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--foreground-muted)]">Order ID</span>
                  <span className="text-[var(--foreground)] font-mono text-xs break-all max-w-[140px] sm:max-w-none">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--foreground-muted)]">Created</span>
                  <span className="text-[var(--foreground)]">{formatDate(order.created_at)}</span>
                </div>
                {order.tracking_number && (
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Tracking #</span>
                    <span className="text-[var(--foreground)] font-medium">{order.tracking_number}</span>
                  </div>
                )}
                {order.tracking_notes && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <span className="text-[10px] text-[var(--foreground-muted)]">Tracking Notes</span>
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">{order.tracking_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
