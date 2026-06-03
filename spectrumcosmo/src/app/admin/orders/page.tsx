// app/admin/orders/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, ShoppingCart, Trash2, ChevronDown, Eye, X, Truck, Package, Clock, CheckCircle2, AlertCircle, Upload, Tag, Gift } from 'lucide-react';
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
  items: Array<{ product_name: string }>;
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

  const getStatusStyle = (statusSlug: string) => {
    const status = statuses.find(s => s.slug === statusSlug);
    if (!status) return 'bg-gray-100 text-gray-700';
    
    const colorMap: Record<string, string> = {
      yellow: 'bg-yellow-100 text-yellow-700',
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      orange: 'bg-orange-100 text-orange-700',
      green: 'bg-green-100 text-green-700',
      red: 'bg-red-100 text-red-700',
      gray: 'bg-gray-100 text-gray-700',
    };
    return colorMap[status.color] || 'bg-gray-100 text-gray-700';
  };

  const getStatusName = (statusSlug: string) => {
    const status = statuses.find(s => s.slug === statusSlug);
    return status?.name || statusSlug;
  };

  const openTrackingModal = (order: Order) => {
    setSelectedOrderId(order.id);
    setTrackingNumber(order.tracking_number || '');
    setTrackingNotes(order.tracking_notes || '');
    setAdminNotes(order.admin_notes || '');
    setTrackingModalOpen(true);
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter || o.payment_status === filter || (filter === 'promo' && o.promo_code_applied) || (filter === 'referral' && o.referral_code_used));

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    promo: orders.filter(o => o.promo_code_applied).length,
    referral: orders.filter(o => o.referral_code_used).length,
  };

  return (
    <div className="pt-16 lg:pt-0">
      {/* Header with Stats */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Manage customer orders, track shipments, and process payments</p>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
          <div className="bg-white rounded-xl border p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Orders</p>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-xs text-yellow-600">Pending</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.processing}</p>
            <p className="text-xs text-blue-600">Processing</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
            <p className="text-xs text-green-600">Completed</p>
          </div>
          <div className="bg-purple-50 rounded-xl border border-purple-100 p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.promo}</p>
            <p className="text-xs text-purple-600">Promo Used</p>
          </div>
          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-700">{stats.referral}</p>
            <p className="text-xs text-indigo-600">Referral Used</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-4 border-b pb-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-full transition ${filter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All Orders</button>
          <button onClick={() => setFilter('pending')} className={`px-3 py-1 text-sm rounded-full transition ${filter === 'pending' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Pending</button>
          <button onClick={() => setFilter('processing')} className={`px-3 py-1 text-sm rounded-full transition ${filter === 'processing' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Processing</button>
          <button onClick={() => setFilter('completed')} className={`px-3 py-1 text-sm rounded-full transition ${filter === 'completed' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Completed</button>
          <button onClick={() => setFilter('promo')} className={`px-3 py-1 text-sm rounded-full transition flex items-center gap-1 ${filter === 'promo' ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}><Tag size={12} /> Promo Orders</button>
          <button onClick={() => setFilter('referral')} className={`px-3 py-1 text-sm rounded-full transition flex items-center gap-1 ${filter === 'referral' ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}><Gift size={12} /> Referral Orders</button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3">Order / Customer</th>
                  <th className="text-left px-6 py-3">Items</th>
                  <th className="text-left px-6 py-3">Total</th>
                  <th className="text-left px-6 py-3">Promo / Referral</th>
                  <th className="text-left px-6 py-3">Payment Proof</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Tracking</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.phone_number}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">{order.customer_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px] truncate">
                      {order.items?.map((i: any) => i.product_name).join(', ') || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      MWK {Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {order.promo_code_applied && (
                        <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-full inline-flex mb-1">
                          <Tag size={10} /> {order.promo_code_applied}
                          <span className="text-purple-500">(-{order.promo_discount?.toLocaleString()})</span>
                        </div>
                      )}
                      {order.referral_code_used && (
                        <div className="flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full inline-flex">
                          <Gift size={10} /> {order.referral_code_used}
                          <span className={`ml-1 text-${order.referral_status === 'completed' ? 'green' : 'yellow'}-500`}>
                            ({order.referral_status || 'pending'})
                          </span>
                        </div>
                      )}
                      {!order.promo_code_applied && !order.referral_code_used && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {order.proof_of_payment_url ? (
                        <button
                          onClick={() => setPreviewImage(order.proof_of_payment_url!)}
                          className="flex items-center gap-1 text-orange-600 hover:text-orange-800 text-sm"
                        >
                          <Eye size={16} /> View Proof
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No proof</span>
                      )}
                      {order.payment_note && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                          Note: {order.payment_note}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {updatingId === order.id ? (
                        <Loader2 size={16} className="animate-spin text-orange-500" />
                      ) : (
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className={`appearance-none pr-6 pl-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusStyle(order.status)}`}
                          >
                            {statuses.map((s) => (
                              <option key={s.slug} value={s.slug}>{s.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}
                      <span className={`text-xs ml-2 ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {order.payment_status === 'paid' ? '✓ Paid' : 'Pending payment'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {order.tracking_number ? (
                        <button onClick={() => openTrackingModal(order)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <Truck size={14} /> {order.tracking_number.slice(0, 8)}...
                        </button>
                      ) : (
                        <button onClick={() => openTrackingModal(order)} className="text-xs text-gray-400 hover:text-gray-600">
                          Add Tracking
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/orders/${order.id}/receipt`} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Upload Receipt">
                          <Upload size={15} />
                        </Link>
                        <Link href={`/admin/orders/${order.id}`} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="View Details">
                          <Eye size={15} />
                        </Link>
                        <button onClick={() => openTrackingModal(order)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Add Tracking">
                          <Truck size={15} />
                        </button>
                        <button onClick={() => deleteOrder(order.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Delete">
                          <Trash2 size={15} />
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

      {/* Proof of Payment Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700">
              <X size={20} />
            </button>
            <Image src={previewImage} alt="Payment proof" width={800} height={600} className="object-contain w-full h-auto" />
          </div>
        </div>
      )}

      {/* Tracking Info Modal */}
      {trackingModalOpen && selectedOrderId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTrackingModalOpen(false)}>
          <div className="relative max-w-md w-full bg-white rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Order Tracking Info</h2>
              <button onClick={() => setTrackingModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g., TRK-123456789" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Notes (for customer)</label>
                <textarea value={trackingNotes} onChange={(e) => setTrackingNotes(e.target.value)} placeholder="e.g., Handed to courier, expected delivery in 2-3 days" rows={3} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (internal only)</label>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Internal notes about this order" rows={2} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setTrackingModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button onClick={() => updateTracking(selectedOrderId)} disabled={updatingId === selectedOrderId} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50">
                  {updatingId === selectedOrderId ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Tracking Info'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
