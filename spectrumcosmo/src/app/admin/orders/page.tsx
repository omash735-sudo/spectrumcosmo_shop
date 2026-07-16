'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Loader2, ShoppingCart, Trash2, ChevronDown, Eye, X, Truck, 
  Package, Clock, CheckCircle2, AlertCircle, Upload, Tag, Gift,
  FileSpreadsheet, FileText, Printer, Download, Filter, Calendar,
  Search, RefreshCw, Sparkles, Banknote, AlertTriangle
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  delivery_address: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  tracking_number: string | null;
  tracking_notes: string | null;
  admin_notes: string | null;
  proof_of_payment_url: string | null;
  payment_note: string | null;
  custom_delivery_method: string | null;
  promo_code: string | null;
  referral_code: string | null;
  discount_amount: number;
  tax_amount: number;
  expires_at: string;
  invoice_number: string | null;
  items: Array<{ product_name: string; quantity: number; unit_price: number; total_price: number }>;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-950/30' },
  processing: { label: 'Processing', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/30' },
  shipped: { label: 'Shipped', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950/30' },
  delivered: { label: 'Delivered', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950/30' },
  cancelled: { label: 'Cancelled', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30' },
  awaiting_verification: { label: 'Awaiting Verification', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950/30' },
};

const paymentStatusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-950/30' },
  awaiting_verification: { label: 'Awaiting Verification', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950/30' },
  paid: { label: 'Paid', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950/30' },
  failed: { label: 'Failed', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30' },
};

// ===== SKELETON =====
function OrdersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-[var(--background-secondary)] rounded w-24" />
          <div className="h-10 bg-[var(--background-secondary)] rounded w-10" />
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-[var(--background-secondary)] rounded-xl" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-[var(--background-secondary)] rounded w-24" />
        ))}
      </div>
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)]">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[var(--background-secondary)] rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingNotes, setTrackingNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      const ordersData = data.orders || data || [];
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrder = async (id: string, updates: any) => {
    setUpdatingId(id);
    try {
      await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      await fetchOrders();
      toast.success('Order updated successfully');
    } catch (err) {
      console.error('Failed to update order:', err);
      toast.error('Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateTracking = async (id: string) => {
    setUpdatingId(id);
    try {
      await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          trackingNumber, 
          trackingNotes,
          adminNotes 
        }),
      });
      await fetchOrders();
      setTrackingModalOpen(false);
      setTrackingNumber('');
      setTrackingNotes('');
      setAdminNotes('');
      toast.success('Tracking updated successfully');
    } catch (err) {
      console.error('Failed to update tracking:', err);
      toast.error('Failed to update tracking');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Delete this order permanently?')) return;
    try {
      await fetch(`/api/admin/orders?id=${id}`, { method: 'DELETE' });
      await fetchOrders();
      toast.success('Order deleted');
    } catch (err) {
      console.error('Failed to delete order:', err);
      toast.error('Failed to delete order');
    }
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      const dataToExport = filteredOrders;
      const headers = [
        'Order Number', 'Customer Name', 'Customer Email', 'Phone Number',
        'Total Amount (MWK)', 'Status', 'Payment Status', 'Order Date',
        'Items', 'Tracking Number', 'Courier', 'Promo Code'
      ];

      const rows = dataToExport.map(order => [
        order.order_number || order.id.slice(-8),
        order.customer_name,
        order.customer_email,
        order.phone_number,
        order.total_amount,
        order.status,
        order.payment_status,
        new Date(order.created_at).toLocaleString(),
        order.items?.map(i => i.product_name).join('; ') || '',
        order.tracking_number || '',
        order.custom_delivery_method || '',
        order.promo_code || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 19)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const openTrackingModal = (order: Order) => {
    setSelectedOrderId(order.id);
    setTrackingNumber(order.tracking_number || '');
    setTrackingNotes(order.tracking_notes || '');
    setAdminNotes(order.admin_notes || '');
    setTrackingModalOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (paymentFilter !== 'all' && order.payment_status !== paymentFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return order.customer_name.toLowerCase().includes(search) ||
             order.id.toLowerCase().includes(search) ||
             (order.order_number && order.order_number.toLowerCase().includes(search));
    }
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    awaitingVerification: orders.filter(o => o.payment_status === 'awaiting_verification').length,
    paid: orders.filter(o => o.payment_status === 'paid').length,
  };

  const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <OrdersSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Order Management</h1>
              </div>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">Manage customer orders, track shipments, and process payments</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                disabled={exporting || filteredOrders.length === 0}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition disabled:opacity-50 min-h-[40px]"
              >
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button 
                onClick={fetchOrders} 
                className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <RefreshCw size={18} className="text-[var(--foreground-muted)]" />
              </button>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mt-4">
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-2 sm:p-3 text-center shadow-sm">
              <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] truncate">Total Orders</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
              <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-500 truncate">Pending</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800 p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.awaitingVerification}</p>
              <p className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-500 truncate">Verifying</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.processing}</p>
              <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-500 truncate">Processing</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-400">{stats.delivered}</p>
              <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-500 truncate">Delivered</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-2 sm:p-3 text-center">
              <p className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.paid}</p>
              <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-500 truncate">Paid</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-2 sm:px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs sm:text-sm bg-[var(--background-card)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition min-h-[40px]"
            >
              <option value="all">All Status</option>
              {statusOptions.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2 sm:px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs sm:text-sm bg-[var(--background-card)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition min-h-[40px]"
            >
              <option value="all">All Payment</option>
              <option value="pending">Pending</option>
              <option value="awaiting_verification">Awaiting Verification</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
            
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 border border-[var(--border)] rounded-lg text-xs sm:text-sm bg-[var(--background-card)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase tracking-wider bg-[var(--background-secondary)] border-b border-[var(--border)]">
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3">Order / Customer</th>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3">Items</th>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3">Total</th>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3">Status</th>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3">Payment</th>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">Courier</th>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">Date</th>
                  <th className="text-center px-2 sm:px-4 py-2 sm:py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <ShoppingCart size={32} className="text-[var(--foreground-muted)] opacity-30 mx-auto mb-2" />
                      <p className="text-[var(--foreground-muted)] text-sm">No orders found</p>
                      {searchTerm && (
                        <button
                          onClick={() => { setSearchTerm(''); setFilter('all'); setPaymentFilter('all'); }}
                          className="mt-2 text-xs text-[var(--primary)] hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusInfo = statusMap[order.status] || statusMap.pending;
                    const paymentInfo = paymentStatusMap[order.payment_status] || paymentStatusMap.pending;
                    
                    return (
                      <tr key={order.id} className="hover:bg-[var(--background-secondary)] transition">
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-xs sm:text-sm text-[var(--foreground)] truncate max-w-[80px] sm:max-w-[150px]">
                              {order.order_number || `#${order.id.slice(-8)}`}
                            </span>
                            <span className="text-xs sm:text-sm text-[var(--foreground)] truncate max-w-[80px] sm:max-w-[150px]">{order.customer_name}</span>
                            <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)] truncate max-w-[80px] sm:max-w-[150px]">{order.customer_email}</span>
                            <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">{order.phone_number}</span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-[var(--foreground-muted)] max-w-[100px] truncate">
                          {order.items?.map(i => i.product_name).join(', ') || '-'}
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-[var(--foreground)] whitespace-nowrap">
                          MWK {Number(order.total_amount).toLocaleString()}
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                            disabled={updatingId === order.id}
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border-0 cursor-pointer ${statusInfo.bg} ${statusInfo.color} min-w-[70px] sm:min-w-[90px] focus:ring-2 focus:ring-[var(--primary)]`}
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${paymentInfo.bg} ${paymentInfo.color}`}>
                            {paymentInfo.label}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-[var(--foreground-muted)] max-w-[100px] truncate hidden md:table-cell">
                          {order.custom_delivery_method || '-'}
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-[10px] sm:text-xs text-[var(--foreground-muted)] whitespace-nowrap hidden lg:table-cell">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          <div className="flex justify-center gap-0.5 sm:gap-1">
                            <button
                              onClick={() => openTrackingModal(order)}
                              className="p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="Add Tracking"
                            >
                              <Truck size={14} className="sm:w-4 sm:h-4" />
                            </button>
                            {order.proof_of_payment_url && (
                              <button
                                onClick={() => setPreviewImage(order.proof_of_payment_url!)}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 text-[var(--primary)] transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                                title="View Payment Proof"
                              >
                                <Eye size={14} className="sm:w-4 sm:h-4" />
                              </button>
                            )}
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="View Details"
                            >
                              <Package size={14} className="sm:w-4 sm:h-4" />
                            </Link>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="Delete Order"
                            >
                              <Trash2 size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Proof Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-3xl max-h-[90vh] bg-[var(--background-card)] rounded-xl overflow-auto" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setPreviewImage(null)} 
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
              <Image 
                src={previewImage} 
                alt="Payment proof" 
                width={800} 
                height={600} 
                className="object-contain w-full h-auto p-2" 
              />
            </div>
          </div>
        )}

        {/* Tracking Modal */}
        {trackingModalOpen && selectedOrderId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4" onClick={() => setTrackingModalOpen(false)}>
            <div className="relative max-w-md w-full bg-[var(--background-card)] rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[var(--primary)]" />
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Update Tracking</h2>
                </div>
                <button 
                  onClick={() => setTrackingModalOpen(false)} 
                  className="p-1 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <X size={18} className="text-[var(--foreground-muted)]" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Tracking Notes</label>
                  <textarea
                    value={trackingNotes}
                    onChange={(e) => setTrackingNotes(e.target.value)}
                    rows={3}
                    placeholder="Add delivery notes for customer"
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Admin Notes (Internal)</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Internal notes"
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setTrackingModalOpen(false)} 
                    className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px] text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => updateTracking(selectedOrderId)} 
                    disabled={updatingId === selectedOrderId} 
                    className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition disabled:opacity-50 min-h-[44px] text-sm"
                  >
                    {updatingId === selectedOrderId ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
