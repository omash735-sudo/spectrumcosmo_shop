// app/admin/orders/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Loader2, ShoppingCart, Trash2, ChevronDown, Eye, X, Truck, 
  Package, Clock, CheckCircle2, AlertCircle, Upload, Tag, Gift,
  FileSpreadsheet, FileText, Printer, Download, Filter, Calendar,
  Search, RefreshCw
} from 'lucide-react';
import Image from 'next/image';

interface Status {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  tracking_number: string | null;
  tracking_notes: string | null;
  admin_notes: string | null;
  proof_of_payment_url: string | null;
  payment_note: string | null;
  promo_code_applied: string | null;
  promo_discount: number | null;
  referral_code_used: string | null;
  referral_status: string | null;
  items: Array<{ product_name: string; quantity: number; unit_price: number }>;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingNotes, setTrackingNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [exporting, setExporting] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

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

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch('/api/order-statuses');
      const data = await res.json();
      setStatuses(data);
    } catch (err) {
      console.error('Failed to fetch statuses:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStatuses();
  }, [fetchOrders, fetchStatuses]);

  const updateStatus = async (id: string, statusSlug: string) => {
    setUpdatingId(id);
    try {
      await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: statusSlug }),
      });
      await fetchOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
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
    } catch (err) {
      console.error('Failed to update tracking:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Delete this order permanently?')) return;
    try {
      await fetch(`/api/admin/orders?id=${id}`, { method: 'DELETE' });
      fetchOrders();
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  // ========== EXPORT FUNCTIONS ==========
  
  const exportToCSV = () => {
    setExporting(true);
    try {
      const dataToExport = filteredOrders;
      const headers = [
        'Order ID', 'Customer Name', 'Customer Email', 'Phone Number',
        'Total Amount (MWK)', 'Status', 'Payment Status', 'Order Date',
        'Items', 'Tracking Number', 'Promo Code', 'Referral Code'
      ];

      const rows = dataToExport.map(order => [
        order.id,
        order.customer_name,
        order.customer_email,
        order.phone_number,
        order.total_amount,
        order.status,
        order.payment_status,
        new Date(order.created_at).toLocaleString(),
        order.items?.map(i => i.product_name).join('; ') || '',
        order.tracking_number || '',
        order.promo_code_applied || '',
        order.referral_code_used || ''
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
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const exportSingleOrderPDF = async (order: Order) => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/orders/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${order.id.slice(-8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportBulkPDF = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order to export');
      return;
    }
    
    setExporting(true);
    try {
      const ordersToExport = orders.filter(o => selectedOrders.includes(o.id));
      const response = await fetch('/api/admin/orders/export-bulk-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersToExport }),
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bulk_invoices_${new Date().toISOString().slice(0, 19)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF');
    } finally {
      setExporting(false);
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const getStatusStyle = (statusSlug: string) => {
    const status = statuses.find(s => s.slug === statusSlug);
    if (!status) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    
    const colorMap: Record<string, string> = {
      yellow: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400',
      blue: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
      purple: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
      orange: 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400',
      green: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400',
      red: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
      gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    };
    return colorMap[status.color] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const openTrackingModal = (order: Order) => {
    setSelectedOrderId(order.id);
    setTrackingNumber(order.tracking_number || '');
    setTrackingNotes(order.tracking_notes || '');
    setAdminNotes(order.admin_notes || '');
    setTrackingModalOpen(true);
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (searchTerm && !order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !order.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (dateRange.from && new Date(order.created_at) < new Date(dateRange.from)) return false;
    if (dateRange.to && new Date(order.created_at) > new Date(dateRange.to)) return false;
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'delivered' || o.status === 'completed').length,
    promo: orders.filter(o => o.promo_code_applied).length,
    referral: orders.filter(o => o.referral_code_used).length,
  };

  return (
    <div className="pt-16 lg:pt-0">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Management</h1>
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
            {selectedOrders.length > 0 && (
              <button
                onClick={exportBulkPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Export Selected ({selectedOrders.length})
              </button>
            )}
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-xl border border-yellow-100 dark:border-yellow-800 p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">Pending</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-800 p-3 text-center">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.processing}</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Processing</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-100 dark:border-green-800 p-3 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.completed}</p>
            <p className="text-xs text-green-600 dark:text-green-500">Completed</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-800 p-3 text-center">
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.promo}</p>
            <p className="text-xs text-purple-600 dark:text-purple-500">Promo Used</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{stats.referral}</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-500">Referral Used</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex flex-wrap gap-2 flex-1">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>All</button>
            <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'pending' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Pending</button>
            <button onClick={() => setFilter('processing')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'processing' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Processing</button>
            <button onClick={() => setFilter('shipped')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'shipped' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Shipped</button>
            <button onClick={() => setFilter('delivered')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'delivered' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Delivered</button>
          </div>
          
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          
          <button onClick={() => fetchOrders()} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart size={40} className="text-gray-200 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left px-4 py-3">Order / Customer</th>
                  <th className="text-left px-4 py-3">Items</th>
                  <th className="text-left px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Payment</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{order.customer_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{order.phone_number}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[150px]">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                      {order.items?.map((i: any) => i.product_name).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      MWK {Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusStyle(order.status)}`}
                      >
                        {statuses.map((s) => (
                          <option key={s.slug} value={s.slug}>{s.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'}`}>
                        {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => exportSingleOrderPDF(order)}
                          disabled={exporting}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition"
                          title="Download PDF Invoice"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => openTrackingModal(order)}
                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition"
                          title="Add Tracking"
                        >
                          <Truck size={16} />
                        </button>
                        <button
                          onClick={() => setPreviewImage(order.proof_of_payment_url!)}
                          disabled={!order.proof_of_payment_url}
                          className="p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-600 dark:text-orange-400 transition disabled:opacity-30"
                          title="View Payment Proof"
                        >
                          <Eye size={16} />
                        </button>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Update Tracking Info</h2>
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
                <button onClick={() => setTrackingModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancel</button>
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
