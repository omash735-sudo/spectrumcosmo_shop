'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Loader2, ShoppingCart, Trash2, ChevronDown, Eye, X, Truck, 
  Package, Clock, CheckCircle2, AlertCircle, Upload, Tag, Gift,
  FileSpreadsheet, FileText, Printer, Download, Filter, Calendar,
  Search, RefreshCw, Sparkles, Banknote
} from 'lucide-react';
import Image from 'next/image';

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
      setOrders(data.orders || data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
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
      toast.success('Tracking updated');
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
      fetchOrders();
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

  const paymentStats = {
    pending: orders.filter(o => o.payment_status === 'pending').length,
    awaitingVerification: orders.filter(o => o.payment_status === 'awaiting_verification').length,
    paid: orders.filter(o => o.payment_status === 'paid').length,
    failed: orders.filter(o => o.payment_status === 'failed').length,
  };

  const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Management</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage customer orders, track shipments, and process payments</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={exporting || filteredOrders.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              Export CSV
            </button>
            <button onClick={fetchOrders} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-xl border border-yellow-100 dark:border-yellow-800 p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">Pending</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-100 dark:border-orange-800 p-3 text-center">
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.awaitingVerification}</p>
            <p className="text-xs text-orange-600 dark:text-orange-500">Awaiting Verification</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-800 p-3 text-center">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.processing}</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Processing</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-100 dark:border-green-800 p-3 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.delivered}</p>
            <p className="text-xs text-green-600 dark:text-green-500">Delivered</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.paid}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">Paid</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Status</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Payment</option>
            <option value="pending">Pending</option>
            <option value="awaiting_verification">Awaiting Verification</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
          
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-48"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                <th className="text-left px-4 py-3">Order / Customer</th>
                <th className="text-left px-4 py-3">Items</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-left px-4 py-3">Courier</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <ShoppingCart size={32} className="text-gray-200 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 dark:text-gray-500 text-sm">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = statusMap[order.status] || statusMap.pending;
                  const paymentInfo = paymentStatusMap[order.payment_status] || paymentStatusMap.pending;
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {order.order_number || `#${order.id.slice(-8)}`}
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white">{order.customer_name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{order.customer_email}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{order.phone_number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                        {order.items?.map(i => i.product_name).join(', ') || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        MWK {Number(order.total_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                          disabled={updatingId === order.id}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusInfo.bg} ${statusInfo.color}`}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${paymentInfo.bg} ${paymentInfo.color}`}>
                          {paymentInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[120px] truncate">
                        {order.custom_delivery_method || '-'}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => openTrackingModal(order)}
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition"
                            title="Add Tracking"
                          >
                            <Truck size={16} />
                          </button>
                          {order.proof_of_payment_url && (
                            <button
                              onClick={() => setPreviewImage(order.proof_of_payment_url!)}
                              className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-600 dark:text-orange-400 transition"
                              title="View Payment Proof"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition"
                            title="View Details"
                          >
                            <Package size={16} />
                          </Link>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition"
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
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

      {/* Payment Proof Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute top-2 right-2 bg-gray-800 dark:bg-gray-700 text-white rounded-full p-1 hover:bg-gray-700">
              <X size={20} />
            </button>
            <Image src={previewImage} alt="Payment proof" width={800} height={600} className="object-contain w-full h-auto" />
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingModalOpen && selectedOrderId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTrackingModalOpen(false)}>
          <div className="relative max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Update Tracking</h2>
              <button onClick={() => setTrackingModalOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tracking Notes</label>
                <textarea
                  value={trackingNotes}
                  onChange={(e) => setTrackingNotes(e.target.value)}
                  rows={3}
                  placeholder="Add delivery notes for customer"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes (Internal)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  placeholder="Internal notes"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setTrackingModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Cancel
                </button>
                <button onClick={() => updateTracking(selectedOrderId)} disabled={updatingId === selectedOrderId} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50">
                  {updatingId === selectedOrderId ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
