'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Package, ShoppingBag, ArrowLeft, Clock, 
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
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ MWK: 1 });
  const [userCurrency, setUserCurrency] = useState('MWK');
  const [ratesLoaded, setRatesLoaded] = useState(false);

  // Fetch exchange rates
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch('/api/exchange-rates');
        if (res.ok) {
          const data = await res.json();
          setExchangeRates(data);
          setRatesLoaded(true);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        setExchangeRates({ MWK: 1 });
        setRatesLoaded(true);
      }
    }
    fetchRates();
  }, []);

  // Fetch user currency preference
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.preferred_currency) {
            setUserCurrency(data.user.preferred_currency);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }
    fetchUser();
  }, []);

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

  if (loading || !ratesLoaded) {
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
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-5 sm:h-7 bg-[var(--primary)] rounded-full"></div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)]">My Orders</h1>
            </div>
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
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* Filters - Rectangular with curved corners */}
      <div className="mb-6">
        <OrderFilters
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyOrders 
          hasFilters={filterStatus !== 'all' || !!searchTerm}
          onClearFilters={() => { setFilterStatus('all'); setSearchTerm(''); }}
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onRefresh={loadOrders}
              exchangeRates={exchangeRates}
              userCurrency={userCurrency}
            />
          ))}
        </div>
      )}
    </div>
  );
}
