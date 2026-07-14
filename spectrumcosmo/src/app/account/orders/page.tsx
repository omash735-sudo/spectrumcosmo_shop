'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Package, ShoppingBag, ArrowLeft, Sparkles, Clock, 
  CheckCircle2, XCircle, Truck, Send, AlertCircle,
  Loader2, Eye, CreditCard, MapPin, Calendar,
  Search, Filter, ChevronDown, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Order, OrderStatus, PaymentStatus } from '@/lib/types/order';
import { orderService } from '@/lib/services/orderService';
import { STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/order-status';
import OrderCard from './components/OrderCard';
import OrderFilters from './components/OrderFilters';
import EmptyOrders from './components/EmptyOrders';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await orderService.fetchOrders();
      setOrders(data);
      toast.success('Orders refreshed');
    } catch (err) {
      toast.error('Failed to refresh orders');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
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
    awaitingVerification: orders.filter(o => o.status === 'awaiting_verification').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3" />
          <p className="text-[var(--foreground-muted)] text-sm sm:text-base">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <div className="w-1 h-5 sm:h-7 bg-[var(--primary)] rounded-full"></div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)]">My Orders</h1>
              <Sparkles size={14} className="text-[var(--primary)] sm:w-[18px] sm:h-[18px]" />
            </div>
            <p className="text-[var(--foreground-muted)] text-xs sm:text-sm">Track your orders, view payment status, and manage deliveries</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshOrders}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition"
            >
              <RefreshCw size={18} className={`${refreshing ? 'animate-spin' : ''} text-[var(--foreground-muted)]`} />
            </button>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-[var(--primary-hover)] transition"
            >
              <ShoppingBag size={16} />
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total" value={stats.total} color="bg-[var(--background-card)] border-[var(--border)] text-[var(--foreground)]" />
        <StatCard label="Pending" value={stats.pending} color="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-100 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400" />
        <StatCard label="Verifying" value={stats.awaitingVerification} color="bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900 text-orange-700 dark:text-orange-400" />
        <StatCard label="Processing" value={stats.processing} color="bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900 text-purple-700 dark:text-purple-400" />
        <StatCard label="Delivered" value={stats.delivered} color="bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900 text-green-700 dark:text-green-400" />
        <StatCard label="Cancelled" value={stats.cancelled} color="bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900 text-red-700 dark:text-red-400" />
      </div>

      {/* Filters */}
      <OrderFilters
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyOrders 
          hasFilters={filterStatus !== 'all' || !!searchTerm}
          onClearFilters={() => { setFilterStatus('all'); setSearchTerm(''); }}
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} onRefresh={loadOrders} />
          ))}
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border p-3 text-center shadow-sm ${color}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] sm:text-xs truncate">{label}</p>
    </div>
  );
}
