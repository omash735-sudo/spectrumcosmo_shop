'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Loader2, Eye, CheckCircle, Truck, Clock, Package, XCircle, 
  Search, Download, Repeat, MapPin, Calendar, 
  CreditCard, ChevronRight, AlertCircle, 
  ArrowLeft, X, Sparkles, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-50', icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-50', icon: Package },
  shipped: { label: 'Shipped', color: 'text-purple-700', bg: 'bg-purple-50', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle },
  declined: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100', icon: XCircle },
};

function formatOrderNumber(order: any): string {
  if (order.order_number && order.order_number !== 'null') {
    return order.order_number;
  }
  return `#${order.id.slice(-8).toUpperCase()}`;
}

function parseAmount(amount: any): number {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/account/orders');
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const cancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/account/orders?id=${orderId}&action=cancel`, { method: 'PATCH' });
      if (res.ok) {
        toast.success('Order cancelled successfully');
        await loadOrders();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to cancel order');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = async (order: any) => {
    try {
      toast.loading('Adding items to cart...');
      for (const item of order.items || []) {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: item.product_id,
            quantity: item.quantity,
          }),
        });
      }
      toast.dismiss();
      toast.success('Items added to cart! Redirecting to checkout...');
      setTimeout(() => router.push('/checkout'), 1500);
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to reorder. Please try again.');
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
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

  const handleViewTracking = (orderId: string, status: string) => {
    if (status === 'shipped' || status === 'delivered') {
      router.push(`/account/orders/${orderId}/tracking`);
    } else {
      toast.info('Tracking will be available once your order is shipped.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const orderDisplayNumber = formatOrderNumber(order);
    const matchesSearch = searchTerm === '' || 
      orderDisplayNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    pending: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
    totalSpent: orders.reduce((sum, o) => sum + parseAmount(o.total_amount), 0),
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-10 h-10 mx-auto mb-3" />
          <p className="text-gray-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Track and manage your purchases</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Orders</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 shadow-sm">
          <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
          <p className="text-xs text-green-600">Delivered</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 shadow-sm">
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          <p className="text-xs text-yellow-600">In Progress</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-100 p-4 shadow-sm">
          <p className="text-2xl font-bold text-orange-700">MWK {stats.totalSpent.toLocaleString()}</p>
          <p className="text-xs text-orange-600">Total Spent</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filterStatus === 'all' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All Orders</button>
          <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filterStatus === 'pending' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Pending</button>
          <button onClick={() => setFilterStatus('processing')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filterStatus === 'processing' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Processing</button>
          <button onClick={() => setFilterStatus('shipped')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filterStatus === 'shipped' ? 'bg-purple-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Shipped</button>
          <button onClick={() => setFilterStatus('delivered')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${filterStatus === 'delivered' ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Delivered</button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by order #" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">Showing {filteredOrders.length} of {orders.length} orders</p>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">{searchTerm || filterStatus !== 'all' ? 'Try adjusting your filters' : "You haven't placed any orders yet"}</p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition">Start Shopping <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const orderDisplayNumber = formatOrderNumber(order);
            
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><Package size={18} className="text-orange-600" /></div>
                      <div><p className="text-sm font-mono font-medium text-gray-900">{orderDisplayNumber}</p><div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5"><Calendar size={12} /><span>{formatDate(order.created_at)}</span></div></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}><StatusIcon size={12} />{statusConfig.label}</span>
                      <button onClick={() => { setSelectedOrder(order); setShowModal(true); }} className="text-gray-400 hover:text-orange-500 transition p-1"><Eye size={18} /></button>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="space-y-2">
                        {order.items && order.items.slice(0, 2).map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3">
                            {item.image_url ? (<div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"><Image src={item.image_url} alt={item.product_name} width={48} height={48} className="w-full h-full object-cover" /></div>) : (<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package size={20} className="text-gray-400" /></div>)}
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product_name}</p><p className="text-xs text-gray-400">Qty: {item.quantity}</p></div>
                            <p className="text-sm font-medium text-gray-800">MWK {parseAmount(item.unit_price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (<p className="text-xs text-gray-400 pl-14">+{order.items.length - 2} more items</p>)}
                      </div>
                    </div>
                    <div className="text-right"><p className="text-xs text-gray-400">Total Amount</p><p className="text-xl font-bold text-orange-600">MWK {parseAmount(order.total_amount).toLocaleString()}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
                    {order.status === 'pending' && (
                      <button onClick={() => { if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) cancelOrder(order.id); }} disabled={cancellingId === order.id} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50">
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                    <button onClick={() => handleViewTracking(order.id, order.status)} className="px-4 py-2 text-sm text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition inline-flex items-center gap-2">
                      <Truck size={14} /> Track Order
                    </button>
                    <button onClick={() => handleReorder(order)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition inline-flex items-center gap-2">
                      <Repeat size={14} /> Reorder
                    </button>
                    <button onClick={() => handleDownloadInvoice(order.id)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition inline-flex items-center gap-2">
                      <Download size={14} /> Invoice
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex justify-between items-center p-5 border-b"><h2 className="text-xl font-bold text-gray-900">Order Details</h2><button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition"><X size={20} /></button></div>
            <div className="overflow-y-auto p-5 space-y-5 max-h-[calc(85vh-70px)]">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div><p className="text-xs text-gray-400">Order Number</p><p className="text-sm font-mono font-medium">{formatOrderNumber(selectedOrder)}</p></div>
                <div><p className="text-xs text-gray-400">Order Date</p><p className="text-sm font-medium">{formatDate(selectedOrder.created_at)}</p></div>
                <div><p className="text-xs text-gray-400">Payment Status</p><p className="text-sm font-medium capitalize">{selectedOrder.payment_status || 'Pending'}</p></div>
                <div><p className="text-xs text-gray-400">Order Status</p><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedOrder.status]?.bg} ${STATUS_CONFIG[selectedOrder.status]?.color}`}>{STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}</span></div>
              </div>
              <div><h3 className="font-semibold text-gray-900 mb-3">Items</h3><div className="space-y-3">{selectedOrder.items?.map((item: any) => (<div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">{item.image_url ? (<div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"><Image src={item.image_url} alt={item.product_name} width={64} height={64} className="w-full h-full object-cover" /></div>) : (<div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package size={24} className="text-gray-400" /></div>)}<div className="flex-1"><p className="font-medium text-gray-800">{item.product_name}</p><p className="text-xs text-gray-400">Qty: {item.quantity}</p></div><p className="font-semibold text-gray-800">MWK {parseAmount(item.unit_price * item.quantity).toLocaleString()}</p></div>))}</div></div>
              <div className="pt-2"><h3 className="font-semibold text-gray-900 mb-2">Shipping Information</h3><div className="bg-gray-50 rounded-xl p-4 space-y-2"><p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {selectedOrder.customer_name}</p><p className="text-sm text-gray-700"><span className="font-medium">Email:</span> {selectedOrder.customer_email}</p><p className="text-sm text-gray-700"><span className="font-medium">Phone:</span> {selectedOrder.phone_number}</p><p className="text-sm text-gray-700"><span className="font-medium">Address:</span> {selectedOrder.location}</p></div></div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="text-gray-800">MWK {parseAmount(selectedOrder.subtotal || selectedOrder.total_amount).toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Shipping</span><span className="text-gray-800">MWK {parseAmount(selectedOrder.shipping_cost || 0).toLocaleString()}</span></div>
                {selectedOrder.discount_amount > 0 && (<div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>- MWK {parseAmount(selectedOrder.discount_amount).toLocaleString()}</span></div>)}
                <div className="border-t pt-2 flex justify-between font-bold"><span className="text-gray-900">Total</span><span className="text-orange-600 text-lg">MWK {parseAmount(selectedOrder.total_amount).toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
