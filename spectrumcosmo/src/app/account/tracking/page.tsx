'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, CheckCircle2, Truck, Package, CreditCard, MapPin, 
  Hash, Calendar, Clock, Phone, Mail, User, Sparkles,
  ArrowRight, RefreshCw, Share2, ShoppingBag, AlertCircle,
  Map, Navigation, Wifi, WifiOff, ChevronRight, XCircle
} from 'lucide-react';

type BasicOrder = {
  id: string;
  product_name: string;
  product_image?: string;
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'declined';
  created_at: string;
  total_amount: number;
};

type TrackingDetails = {
  order_id: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  order_status: string;
  total_amount: number;
  payment_method: string;
  paid_at: string | null;
  order_placed_at: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  delivery_status: string | null;
  tracking_number: string | null;
  delivery_notes: string | null;
  delivery_address: string | null;
  delivery_created_at: string | null;
  delivery_method_name: string | null;
  delivery_logo: string | null;
  payment_type: string | null;
  payment_provider: string | null;
  payment_account: string | null;
  estimated_delivery_from?: string;
  estimated_delivery_to?: string;
  courier_phone?: string;
  courier_name?: string;
};

const statusSteps = [
  { key: 'placed', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', icon: RefreshCw },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'pending': return 0;
    case 'approved': return 2;
    case 'shipped': return 3;
    case 'delivered': return 4;
    default: return 0;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'delivered': return 'bg-green-500';
    case 'shipped': return 'bg-purple-500';
    case 'approved': return 'bg-blue-500';
    case 'pending': return 'bg-yellow-500';
    default: return 'bg-gray-500';
  }
}

function formatOrderNumber(order: any): string {
  if (order.order_number && order.order_number !== 'null') {
    return order.order_number;
  }
  return `#${order.id.slice(-8).toUpperCase()}`;
}

export default function TrackingPage() {
  const [orders, setOrders] = useState<BasicOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<BasicOrder | null>(null);
  const [trackingDetails, setTrackingDetails] = useState<TrackingDetails | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/account/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        if (data.length > 0 && !selectedOrder) {
          setSelectedOrder(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const fetchTrackingDetails = async (orderId: string) => {
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/tracking`);
      if (res.ok) {
        const data = await res.json();
        setTrackingDetails(data);
        setLastUpdated(new Date());
      } else if (res.status === 404) {
        setDetailsError('Order not found.');
      } else {
        setDetailsError('Failed to load tracking details.');
      }
    } catch (error) {
      console.error('Error fetching tracking details', error);
      setDetailsError('Network error. Please try again.');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (!selectedOrder) {
      setTrackingDetails(null);
      return;
    }
    fetchTrackingDetails(selectedOrder.id);
  }, [selectedOrder]);

  useEffect(() => {
    if (!autoRefresh || !selectedOrder) return;
    const interval = setInterval(() => {
      fetchTrackingDetails(selectedOrder.id);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedOrder]);

  const handleRefresh = () => {
    if (selectedOrder) {
      fetchTrackingDetails(selectedOrder.id);
    }
  };

  const stepIndex = trackingDetails ? getStepIndex(trackingDetails.order_status) : -1;
  const isDeclined = trackingDetails?.order_status === 'declined';
  const progressPercentage = stepIndex >= 0 ? (stepIndex / (statusSteps.length - 1)) * 100 : 0;

  if (loadingOrders) {
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
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        
        {/* Header - With Manga Panel */}
        <div className="manga-bg hero-manga rounded-xl sm:rounded-2xl overflow-hidden mb-8 sm:mb-10">
          <div className="relative z-10 text-center p-6 sm:p-8 md:p-10 bg-[var(--background-card)]/95">
            <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 px-3 py-1 rounded-full mb-4">
              <Truck size={14} className="text-[var(--primary)]" />
              <span className="text-xs font-medium text-[var(--primary)]">Real-time Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--foreground)]">Track Your Orders</h1>
            <p className="text-[var(--foreground-muted)] text-sm sm:text-base mt-2 max-w-md mx-auto">Live updates on every step of your delivery journey</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Order List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl shadow-lg border border-[var(--border)] overflow-hidden sticky top-24">
              <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">My Orders</h2>
                  <span className="text-xs text-[var(--foreground-muted)]">{orders.length} orders</span>
                </div>
              </div>
              <div className="divide-y divide-[var(--border)] max-h-[500px] overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Package size={24} className="text-[var(--foreground-muted)]/50" />
                    </div>
                    <p className="text-[var(--foreground-muted)] text-sm">No orders found</p>
                    <Link href="/products" className="inline-block mt-3 text-[var(--primary)] text-sm hover:underline">
                      Start Shopping →
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => {
                    const orderDisplayNumber = formatOrderNumber(order);
                    return (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`w-full text-left p-3 sm:p-4 transition-all duration-200 group ${
                          selectedOrder?.id === order.id
                            ? 'bg-[var(--primary)]/10 border-l-4 border-l-[var(--primary)]'
                            : 'hover:bg-[var(--background-secondary)]'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--background-secondary)] rounded-xl overflow-hidden flex-shrink-0">
                            {order.product_image ? (
                              <Image src={order.product_image} alt={order.product_name} width={48} height={48} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={16} className="text-[var(--foreground-muted)] sm:w-5 sm:h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--foreground)] text-xs sm:text-sm line-clamp-1">{order.product_name}</p>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                                order.status === 'delivered' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                                order.status === 'shipped' ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400' :
                                order.status === 'approved' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                                order.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400' :
                                'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                              }`}>
                                {order.status}
                              </span>
                              <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">{new Date(order.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-1">MWK {order.total_amount?.toLocaleString()}</p>
                          </div>
                          <ChevronRight size={14} className={`text-[var(--foreground-muted)] mt-2 transition-transform group-hover:translate-x-0.5 ${selectedOrder?.id === order.id ? 'translate-x-0.5 text-[var(--primary)]' : ''}`} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Tracking Details Panel */}
          <div className="lg:col-span-2">
            <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl shadow-lg border border-[var(--border)] overflow-hidden">
              {!selectedOrder ? (
                <div className="text-center py-12 sm:py-16 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={32} className="text-[var(--foreground-muted)]/50" />
                  </div>
                  <p className="text-[var(--foreground-muted)]">Select an order to view tracking details</p>
                </div>
              ) : loadingDetails ? (
                <div className="flex justify-center py-12 sm:py-16">
                  <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8" />
                </div>
              ) : detailsError ? (
                <div className="text-center py-12 sm:py-16 px-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={28} className="text-red-500" />
                  </div>
                  <p className="text-red-500 dark:text-red-400 mb-2 text-sm sm:text-base">{detailsError}</p>
                  <button onClick={handleRefresh} className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm">
                    Try Again →
                  </button>
                </div>
              ) : isDeclined && trackingDetails ? (
                <div className="text-center py-12 sm:py-16 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-2">Order Declined</h3>
                  <p className="text-[var(--foreground-muted)] text-sm">This order could not be processed.</p>
                  <Link href="/contact" className="inline-block mt-4 text-[var(--primary)] hover:underline text-sm">
                    Contact Support →
                  </Link>
                </div>
              ) : trackingDetails ? (
                <>
                  {/* Header */}
                  <div className="p-4 sm:p-6 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                    <div className="flex flex-wrap justify-between items-start gap-3 sm:gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          <Package size={14} className="text-[var(--primary)]" />
                          <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">Order #{trackingDetails.order_id.slice(-8)}</span>
                        </div>
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--foreground)]">{trackingDetails.product_name}</h2>
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">Qty: {trackingDetails.quantity}</p>
                      </div>
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={handleRefresh}
                          disabled={loadingDetails}
                          className="p-1.5 sm:p-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition rounded-lg hover:bg-[var(--primary)]/10"
                        >
                          <RefreshCw size={16} className={loadingDetails ? 'animate-spin' : ''} />
                        </button>
                        <button className="p-1.5 sm:p-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition rounded-lg hover:bg-[var(--primary)]/10">
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-4 sm:px-6 pt-5 sm:pt-6">
                    <div className="relative">
                      <div className="h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        {statusSteps.map((step, idx) => {
                          const Icon = step.icon;
                          const isCompleted = idx <= stepIndex;
                          return (
                            <div key={step.key} className="text-center -mt-2">
                              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto transition-all ${
                                isCompleted ? 'bg-[var(--primary)] text-white' : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
                              }`}>
                                {isCompleted && idx === stepIndex ? (
                                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse" />
                                ) : (
                                  <Icon size={12} className="sm:w-3.5 sm:h-3.5" />
                                )}
                              </div>
                              <p className={`text-[10px] sm:text-xs mt-1 ${isCompleted ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground-muted)]'}`}>
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Live Status Banner */}
                  <div className="mx-4 sm:mx-6 mt-5 sm:mt-6 p-3 sm:p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                          {trackingDetails.order_status === 'delivered' ? 'Delivered Successfully' :
                           trackingDetails.order_status === 'shipped' ? 'On Its Way!' :
                           trackingDetails.order_status === 'approved' ? 'Processing Your Order' :
                           'Order Confirmed'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5">
                          {trackingDetails.delivery_notes || 'Your order is being processed'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery & Payment Details Grid */}
                  <div className="p-4 sm:p-6">
                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Delivery Info Card */}
                      <div className="bg-[var(--background-secondary)] rounded-xl p-3.5 sm:p-4">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                          <Truck size={14} className="text-[var(--primary)]" />
                          <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">Delivery Information</h3>
                        </div>
                        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                          {trackingDetails.delivery_address && (
                            <div className="flex gap-2">
                              <MapPin size={12} className="text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                              <p className="text-[var(--foreground-muted)] break-words">{trackingDetails.delivery_address}</p>
                            </div>
                          )}
                          {trackingDetails.tracking_number && (
                            <div className="flex gap-2">
                              <Hash size={12} className="text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[var(--foreground-muted)] text-[10px] sm:text-xs">Tracking Number</p>
                                <p className="font-mono text-xs sm:text-sm text-[var(--foreground)]">{trackingDetails.tracking_number}</p>
                              </div>
                            </div>
                          )}
                          {trackingDetails.delivery_method_name && (
                            <div className="flex gap-2">
                              <Package size={12} className="text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[var(--foreground-muted)] text-[10px] sm:text-xs">Delivery Method</p>
                                <p className="text-[var(--foreground)]">{trackingDetails.delivery_method_name}</p>
                              </div>
                            </div>
                          )}
                          {trackingDetails.courier_name && (
                            <div className="flex gap-2">
                              <User size={12} className="text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[var(--foreground-muted)] text-[10px] sm:text-xs">Courier</p>
                                <p className="text-[var(--foreground)]">{trackingDetails.courier_name}</p>
                              </div>
                            </div>
                          )}
                          {trackingDetails.courier_phone && (
                            <div className="flex gap-2">
                              <Phone size={12} className="text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[var(--foreground-muted)] text-[10px] sm:text-xs">Courier Phone</p>
                                <a href={`tel:${trackingDetails.courier_phone}`} className="text-[var(--primary)] hover:underline text-xs sm:text-sm">
                                  {trackingDetails.courier_phone}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Info Card */}
                      <div className="bg-[var(--background-secondary)] rounded-xl p-3.5 sm:p-4">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                          <CreditCard size={14} className="text-[var(--primary)]" />
                          <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">Payment Information</h3>
                        </div>
                        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                          <div className="flex justify-between flex-wrap gap-1">
                            <span className="text-[var(--foreground-muted)]">Payment Method</span>
                            <span className="text-[var(--foreground)]">{trackingDetails.payment_provider || trackingDetails.payment_method || 'Cash on Delivery'}</span>
                          </div>
                          <div className="flex justify-between flex-wrap gap-1">
                            <span className="text-[var(--foreground-muted)]">Total Amount</span>
                            <span className="font-bold text-[var(--primary)]">MWK {trackingDetails.total_amount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between flex-wrap gap-1">
                            <span className="text-[var(--foreground-muted)]">Payment Status</span>
                            <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                              trackingDetails.paid_at ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
                            }`}>
                              {trackingDetails.paid_at ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                          {trackingDetails.paid_at && (
                            <div className="flex justify-between flex-wrap gap-1">
                              <span className="text-[var(--foreground-muted)]">Paid On</span>
                              <span className="text-[var(--foreground)]">{new Date(trackingDetails.paid_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Estimated Delivery */}
                    {(trackingDetails.estimated_delivery_from || trackingDetails.estimated_delivery_to) && (
                      <div className="mt-4 sm:mt-5 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3.5 sm:p-4 border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                          <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">Estimated Delivery</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 mt-1">
                          {trackingDetails.estimated_delivery_from && trackingDetails.estimated_delivery_to
                            ? `${new Date(trackingDetails.estimated_delivery_from).toLocaleDateString()} - ${new Date(trackingDetails.estimated_delivery_to).toLocaleDateString()}`
                            : 'Please check back for updates'}
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 text-[10px] sm:text-xs text-[var(--foreground-muted)] border-t border-[var(--border)] flex flex-wrap justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="sm:w-3 sm:h-3" />
                        <span>Order placed: {new Date(trackingDetails.order_placed_at).toLocaleString()}</span>
                      </div>
                      {trackingDetails.delivery_created_at && (
                        <div className="flex items-center gap-1">
                          <RefreshCw size={10} className="sm:w-3 sm:h-3" />
                          <span>Last updated: {new Date(trackingDetails.delivery_created_at).toLocaleString()}</span>
                        </div>
                      )}
                      {autoRefresh && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
                          <Wifi size={10} className="sm:w-3 sm:h-3" />
                          <span>Live updates active</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 sm:mt-6 flex flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-[var(--border)]">
                      <Link
                        href={`/account/orders/${trackingDetails.order_id}`}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--background-secondary)] text-[var(--foreground)] rounded-lg text-xs sm:text-sm font-medium hover:bg-[var(--border)] transition"
                      >
                        View Order Details
                        <ArrowRight size={12} />
                      </Link>
                      {trackingDetails.order_status === 'delivered' && (
                        <Link
                          href="/products"
                          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--primary)] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[var(--primary-hover)] transition"
                        >
                          <ShoppingBag size={12} />
                          Shop Again
                        </Link>
                      )}
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-[var(--border)] rounded-lg text-xs sm:text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition"
                      >
                        <Phone size={12} />
                        Need Help?
                      </Link>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
