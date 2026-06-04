'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Loader2, Eye, CheckCircle, Truck, Clock, Package, XCircle, 
  Search, Download, Repeat, Calendar, X, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// Types
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'declined' | 'cancelled';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  image_url?: string;
}

interface Order {
  id: string;
  order_number?: string;
  status: OrderStatus;
  created_at: string;
  total_amount: number;
  subtotal?: number;
  shipping_cost?: number;
  discount_amount?: number;
  payment_status?: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  location: string;
  items: OrderItem[];
}

interface StatusConfig {
  label: string;
  color: string;
  icon: any;
  bg: string;
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-50', icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-50', icon: Package },
  shipped: { label: 'Shipped', color: 'text-purple-700', bg: 'bg-purple-50', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle },
  declined: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-50', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100', icon: XCircle },
};

// Helper functions
function formatOrderNumber(order: Order): string {
  if (order.order_number && order.order_number !== 'null') {
    return order.order_number;
  }
  return `#${order.id.slice(-8).toUpperCase()}`;
}

function parseAmount(amount: number | string | null | undefined): number {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Custom info toast
function showInfoToast(message: string) {
  toast(message, {
    duration: 3000,
    style: {
      background: '#f59e0b',
      color: '#fff',
      borderRadius: '8px',
    },
  });
}

// Skeleton loader component
function OrdersSkeleton() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-orange-500 w-10 h-10 mx-auto mb-3" />
        <p className="text-gray-500">Loading your orders...</p>
      </div>
    </div>
  );
}

// Empty state component
function EmptyOrders({ searchTerm, filterStatus }: { searchTerm: string; filterStatus: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
      <Package size={48} className="text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
      <p className="text-gray-500 mb-6">
        {searchTerm || filterStatus !== 'all' 
          ? 'Try adjusting your filters' 
          : "You haven't placed any orders yet"}
      </p>
      <Link 
        href="/products" 
        className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition"
      >
        Start Shopping <ArrowRight size={16} />
      </Link>
    </div>
  );
}

// Stats card component
function StatCard({ label, value, colorClass }: { label: string; value: string | number; colorClass: string }) {
  return (
    <div className={`${colorClass} rounded-xl border p-4 shadow-sm`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/account/orders');
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to load orders:', errorMessage);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/account/orders?id=${orderId}&action=cancel`, { method: 'PATCH' });
      if (res.ok) {
        toast.success('Order cancelled successfully');
        await loadOrders();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to cancel order');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Cancel order error:', errorMessage);
      toast.error('An error occurred while cancelling');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = async (order: Order) => {
    const toastId = toast.loading('Adding items to cart...');
    
    try {
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
      
      toast.dismiss(toastId);
      toast.success('Items added to cart! Redirecting to checkout...');
      setTimeout(() => router.push('/checkout'), 1500);
    } catch (err) {
      toast.dismiss(toastId);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Reorder error:', errorMessage);
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Invoice download error:', errorMessage);
      toast.error('Failed to download invoice');
    }
  };

  const handleViewTracking = (orderId: string, status: OrderStatus) => {
    if (status === 'shipped' || status === 'delivered') {
      router.push(`/account/orders/${orderId}/tracking`);
    } else {
      showInfoToast('Tracking will be available once your order is shipped.');
    }
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const orderDisplayNumber = formatOrderNumber(order);
    const matchesSearch = searchTerm === '' || 
      orderDisplayNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Stats calculation
  const stats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    pending: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
    totalSpent: orders.reduce((sum, o) => sum + parseAmount(o.total_amount), 0),
  };

  if (loading) {
    return <OrdersSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track and manage your purchases</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Total Orders" 
          value={stats.total} 
          colorClass="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white"
        />
        <StatCard 
          label="Delivered" 
          value={stats.delivered} 
          colorClass="bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900 text-green-700 dark:text-green-400"
        />
        <StatCard 
          label="In Progress" 
          value={stats.pending} 
          colorClass="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-100 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400"
        />
        <StatCard 
          label="Total Spent" 
          value={`MWK ${stats.totalSpent.toLocaleString()}`} 
          colorClass="bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900 text-orange-700 dark:text-orange-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'processing', 'shipped', 'delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition capitalize ${
                filterStatus === status 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'all' ? 'All Orders' : status}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by order #" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Showing {filteredOrders.length} of {orders.length} orders
      </p>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyOrders searchTerm={searchTerm} filterStatus={filterStatus} />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const orderDisplayNumber = formatOrderNumber(order);
            
            return (
              <div key={order.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Order Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <Package size={18} className="text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{orderDisplayNumber}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <Calendar size={12} />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                      <button 
                        onClick={() => { setSelectedOrder(order); setShowModal(true); }} 
                        className="text-gray-400 hover:text-orange-500 transition p-1"
                        aria-label="View order details"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Order Body */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="space-y-2">
                        {order.items?.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            {item.image_url ? (
                              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                <Image src={item.image_url} alt={item.product_name} width={48} height={48} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package size={20} className="text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{item.product_name}</p>
                              <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              MWK {parseAmount(item.unit_price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <p className="text-xs text-gray-400 pl-14">+{order.items.length - 2} more items</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total Amount</p>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        MWK {parseAmount(order.total_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => cancelOrder(order.id)} 
                        disabled={cancellingId === order.id} 
                        className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                    <button 
                      onClick={() => handleViewTracking(order.id, order.status)} 
                      className="px-4 py-2 text-sm text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition inline-flex items-center gap-2"
                    >
                      <Truck size={14} /> Track Order
                    </button>
                    <button 
                      onClick={() => handleReorder(order)} 
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition inline-flex items-center gap-2"
                    >
                      <Repeat size={14} /> Reorder
                    </button>
                    <button 
                      onClick={() => handleDownloadInvoice(order.id)} 
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition inline-flex items-center gap-2"
                    >
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 flex justify-between items-center p-5 border-b dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-5 space-y-5 max-h-[calc(85vh-70px)]">
              {/* Order Info Grid */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-400">Order Number</p>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{formatOrderNumber(selectedOrder)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Order Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Payment Status</p>
                  <p className="text-sm font-medium capitalize text-gray-900 dark:text-white">{selectedOrder.payment_status || 'Pending'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Order Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedOrder.status]?.bg} ${STATUS_CONFIG[selectedOrder.status]?.color}`}>
                    {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>
              </div>
              
              {/* Items List */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      {item.image_url ? (
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.image_url} alt={item.product_name} width={64} height={64} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package size={24} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{item.product_name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        MWK {parseAmount(item.unit_price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Shipping Info */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Shipping Information</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Name:</span> {selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Email:</span> {selectedOrder.customer_email}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Phone:</span> {selectedOrder.phone_number}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Address:</span> {selectedOrder.location}</p>
                </div>
              </div>
              
              {/* Price Breakdown - FIXED: discount_amount undefined check */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    MWK {parseAmount(selectedOrder.subtotal || selectedOrder.total_amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    MWK {parseAmount(selectedOrder.shipping_cost || 0).toLocaleString()}
                  </span>
                </div>
                {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>- MWK {parseAmount(selectedOrder.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t dark:border-gray-700 pt-2 flex justify-between font-bold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-orange-600 dark:text-orange-400 text-lg">
                    MWK {parseAmount(selectedOrder.total_amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
