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
  pending: { label: 'Pending', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30', icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: Package },
  shipped: { label: 'Shipped', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', icon: CheckCircle },
  declined: { label: 'Declined', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-gray-700 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', icon: XCircle },
};

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

function OrdersSkeleton() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3" />
        <p className="text-[var(--foreground-muted)] text-sm sm:text-base">Loading your orders...</p>
      </div>
    </div>
  );
}

function EmptyOrders({ searchTerm, filterStatus }: { searchTerm: string; filterStatus: string }) {
  return (
    <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl border border-[var(--border)] p-8 sm:p-12 text-center shadow-sm">
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
        <Package size={28} className="text-[var(--foreground-muted)]/50 sm:w-8 sm:h-8" />
      </div>
      <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-2">No orders found</h3>
      <p className="text-[var(--foreground-muted)] text-sm mb-5 sm:mb-6">
        {searchTerm || filterStatus !== 'all' 
          ? 'Try adjusting your filters' 
          : "You haven't placed any orders yet"}
      </p>
      <Link 
        href="/products" 
        className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium text-sm sm:text-base hover:bg-[var(--primary-hover)] transition"
      >
        Start Shopping <ArrowRight size={14} className="sm:w-4 sm:h-4" />
      </Link>
    </div>
  );
}

function StatCard({ label, value, colorClass }: { label: string; value: string | number; colorClass: string }) {
  return (
    <div className={`${colorClass} rounded-xl border p-3 sm:p-4 shadow-sm`}>
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
      <p className="text-[10px] sm:text-xs">{label}</p>
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
      console.error('Failed to load orders:', err);
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
      console.error('Cancel order error:', err);
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
      console.error('Reorder error:', err);
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
      console.error('Invoice download error:', err);
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

  if (loading) {
    return <OrdersSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 md:py-8">
      
      {/* Header - With Manga Panel */}
      <div className="manga-bg hero-manga rounded-xl sm:rounded-2xl overflow-hidden mb-5 sm:mb-6 md:mb-8">
        <div className="relative z-10 p-4 sm:p-6 md:p-8 bg-[var(--background-card)]/95">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)]">My Orders</h1>
          <p className="text-[var(--foreground-muted)] text-xs sm:text-sm mt-1">Track and manage your purchases</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard 
          label="Total Orders" 
          value={stats.total} 
          colorClass="bg-[var(--background-card)] border-[var(--border)] text-[var(--foreground)]"
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
          colorClass="bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {['all', 'pending', 'processing', 'shipped', 'delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-sm font-medium transition capitalize ${
                filterStatus === status 
                  ? 'bg-[var(--primary)] text-white shadow-sm' 
                  : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--border)]'
              }`}
            >
              {status === 'all' ? 'All Orders' : status}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input 
            type="text" 
            placeholder="Search by order #" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mb-3 sm:mb-4">
        Showing {filteredOrders.length} of {orders.length} orders
      </p>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyOrders searchTerm={searchTerm} filterStatus={filterStatus} />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const orderDisplayNumber = formatOrderNumber(order);
            
            return (
              <div key={order.id} className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                
                {/* Order Header */}
                <div className="p-3 sm:p-4 md:p-5 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                        <Package size={14} className="text-[var(--primary)] sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-mono font-medium text-[var(--foreground)]">{orderDisplayNumber}</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5">
                          <Calendar size={10} className="sm:w-3 sm:h-3" />
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                        {statusConfig.label}
                      </span>
                      <button 
                        onClick={() => { setSelectedOrder(order); setShowModal(true); }} 
                        className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition p-0.5 sm:p-1"
                        aria-label="View order details"
                      >
                        <Eye size={14} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Order Body */}
                <div className="p-3 sm:p-4 md:p-5">
                  <div className="flex flex-wrap justify-between items-start gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="space-y-2">
                        {order.items?.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-center gap-2 sm:gap-3">
                            {item.image_url ? (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--background-secondary)] rounded-lg overflow-hidden flex-shrink-0">
                                <Image src={item.image_url} alt={item.product_name} width={48} height={48} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--background-secondary)] rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package size={16} className="text-[var(--foreground-muted)] sm:w-5 sm:h-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-[var(--foreground)] line-clamp-1">{item.product_name}</p>
                              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-[var(--foreground)] whitespace-nowrap">
                              MWK {parseAmount(item.unit_price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] pl-11 sm:pl-14">+{order.items.length - 2} more items</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Amount</p>
                      <p className="text-base sm:text-xl font-bold text-[var(--primary)]">
                        MWK {parseAmount(order.total_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-[var(--border)]">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => cancelOrder(order.id)} 
                        disabled={cancellingId === order.id} 
                        className="px-2.5 sm:px-4 py-1 sm:py-2 text-[11px] sm:text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                    <button 
                      onClick={() => handleViewTracking(order.id, order.status)} 
                      className="px-2.5 sm:px-4 py-1 sm:py-2 text-[11px] sm:text-sm text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg hover:bg-[var(--primary)]/10 transition inline-flex items-center gap-1 sm:gap-2"
                    >
                      <Truck size={12} className="sm:w-3.5 sm:h-3.5" /> Track Order
                    </button>
                    <button 
                      onClick={() => handleReorder(order)} 
                      className="px-2.5 sm:px-4 py-1 sm:py-2 text-[11px] sm:text-sm text-[var(--foreground-muted)] border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition inline-flex items-center gap-1 sm:gap-2"
                    >
                      <Repeat size={12} className="sm:w-3.5 sm:h-3.5" /> Reorder
                    </button>
                    <button 
                      onClick={() => handleDownloadInvoice(order.id)} 
                      className="px-2.5 sm:px-4 py-1 sm:py-2 text-[11px] sm:text-sm text-[var(--foreground-muted)] border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition inline-flex items-center gap-1 sm:gap-2"
                    >
                      <Download size={12} className="sm:w-3.5 sm:h-3.5" /> Invoice
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[var(--background-card)] flex justify-between items-center p-3.5 sm:p-5 border-b border-[var(--border)]">
              <h2 className="text-base sm:text-xl font-bold text-[var(--foreground)]">Order Details</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--background-secondary)] rounded-lg transition" aria-label="Close">
                <X size={18} className="sm:w-5 sm:h-5 text-[var(--foreground-muted)]" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-3.5 sm:p-5 space-y-4 sm:space-y-5 max-h-[calc(85vh-60px)]">
              {/* Order Info Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-[var(--border)]">
                <div>
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Order Number</p>
                  <p className="text-xs sm:text-sm font-mono font-medium text-[var(--foreground)]">{formatOrderNumber(selectedOrder)}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Order Date</p>
                  <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Payment Status</p>
                  <p className="text-xs sm:text-sm font-medium capitalize text-[var(--foreground)]">{selectedOrder.payment_status || 'Pending'}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Order Status</p>
                  <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${STATUS_CONFIG[selectedOrder.status]?.bg} ${STATUS_CONFIG[selectedOrder.status]?.color}`}>
                    {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>
              </div>
              
              {/* Items List */}
              <div>
                <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-2 sm:mb-3">Items</h3>
                <div className="space-y-2 sm:space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 sm:gap-3 py-2 border-b border-[var(--border)] last:border-0">
                      {item.image_url ? (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.image_url} alt={item.product_name} width={64} height={64} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package size={20} className="text-[var(--foreground-muted)] sm:w-6 sm:h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">{item.product_name}</p>
                        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-[var(--foreground)] whitespace-nowrap">
                        MWK {parseAmount(item.unit_price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Shipping Info */}
              <div>
                <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-2">Shipping Information</h3>
                <div className="bg-[var(--background-secondary)] rounded-xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                  <p className="text-xs sm:text-sm text-[var(--foreground)]"><span className="font-medium">Name:</span> {selectedOrder.customer_name}</p>
                  <p className="text-xs sm:text-sm text-[var(--foreground)]"><span className="font-medium">Email:</span> {selectedOrder.customer_email}</p>
                  <p className="text-xs sm:text-sm text-[var(--foreground)]"><span className="font-medium">Phone:</span> {selectedOrder.phone_number}</p>
                  <p className="text-xs sm:text-sm text-[var(--foreground)]"><span className="font-medium">Address:</span> {selectedOrder.location}</p>
                </div>
              </div>
              
              {/* Price Breakdown */}
              <div className="bg-[var(--background-secondary)] rounded-xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[var(--foreground-muted)]">Subtotal</span>
                  <span className="text-[var(--foreground)]">
                    MWK {parseAmount(selectedOrder.subtotal || selectedOrder.total_amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[var(--foreground-muted)]">Shipping</span>
                  <span className="text-[var(--foreground)]">
                    MWK {parseAmount(selectedOrder.shipping_cost || 0).toLocaleString()}
                  </span>
                </div>
                {selectedOrder.discount_amount && selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>- MWK {parseAmount(selectedOrder.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-[var(--border)] pt-1.5 sm:pt-2 flex justify-between font-bold">
                  <span className="text-[var(--foreground)] text-sm sm:text-base">Total</span>
                  <span className="text-[var(--primary)] text-base sm:text-lg">
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
