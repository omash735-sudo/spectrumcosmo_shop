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

// Helper function to format order number
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

  // Auto-refresh every 30 seconds
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
          <Loader2 className="animate-spin text-orange-500 w-10 h-10 mx-auto mb-3" />
          <p className="text-gray-500">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full mb-4">
            <Truck size={14} className="text-orange-600" />
            <span className="text-xs font-medium text-orange-600">Real-time Tracking</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Track Your Orders</h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">Live updates on every step of your delivery journey</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
              <div className="px-5 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">My Orders</h2>
                  <span className="text-xs text-gray-400">{orders.length} orders</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No orders found</p>
                    <Link href="/products" className="inline-block mt-3 text-orange-500 text-sm hover:underline">
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
                        className={`w-full text-left p-4 transition-all duration-200 group ${
                          selectedOrder?.id === order.id
                            ? 'bg-orange-50 border-l-4 border-orange-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                            {order.product_image ? (
                              <Image src={order.product_image} alt={order.product_name} width={48} height={48} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={20} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm line-clamp-1">{order.product_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                                order.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {order.status}
                              </span>
                              <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">MWK {order.total_amount?.toLocaleString()}</p>
                          </div>
                          <ChevronRight size={16} className={`text-gray-400 mt-3 transition-transform group-hover:translate-x-0.5 ${selectedOrder?.id === order.id ? 'translate-x-0.5 text-orange-500' : ''}`} />
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {!selectedOrder ? (
                <div className="text-center py-16 px-4">
                  <Package size={64} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select an order to view tracking details</p>
                </div>
              ) : loadingDetails ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
                </div>
              ) : detailsError ? (
                <div className="text-center py-16 px-4">
                  <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                  <p className="text-red-500 mb-2">{detailsError}</p>
                  <button onClick={handleRefresh} className="text-orange-500 hover:text-orange-600 text-sm">
                    Try Again →
                  </button>
                </div>
              ) : isDeclined && trackingDetails ? (
                <div className="text-center py-16 px-4">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle size={40} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Declined</h3>
                  <p className="text-gray-500">This order could not be processed.</p>
                  <Link href="/contact" className="inline-block mt-4 text-orange-500 hover:underline">
                    Contact Support →
                  </Link>
                </div>
              ) : trackingDetails ? (
                <>
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Package size={16} className="text-orange-500" />
                          <span className="text-sm text-gray-500">Order #{trackingDetails.order_id.slice(-8)}</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{trackingDetails.product_name}</h2>
                        <p className="text-sm text-gray-500 mt-1">Qty: {trackingDetails.quantity}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRefresh}
                          disabled={loadingDetails}
                          className="p-2 text-gray-400 hover:text-orange-500 transition rounded-lg hover:bg-orange-50"
                        >
                          <RefreshCw size={18} className={loadingDetails ? 'animate-spin' : ''} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-orange-500 transition rounded-lg hover:bg-orange-50">
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-6 pt-6">
                    <div className="relative">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        {statusSteps.map((step, idx) => {
                          const Icon = step.icon;
                          const isCompleted = idx <= stepIndex;
                          return (
                            <div key={step.key} className="text-center -mt-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all ${
                                isCompleted ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {isCompleted && idx === stepIndex ? (
                                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                ) : (
                                  <Icon size={14} />
                                )}
                              </div>
                              <p className={`text-xs mt-1 ${isCompleted ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Live Status Banner */}
                  <div className="mx-6 mt-6 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          {trackingDetails.order_status === 'delivered' ? 'Delivered Successfully' :
                           trackingDetails.order_status === 'shipped' ? 'On Its Way!' :
                           trackingDetails.order_status === 'approved' ? 'Processing Your Order' :
                           'Order Confirmed'}
                        </p>
                        <p className="text-xs text-orange-600 mt-0.5">
                          {trackingDetails.delivery_notes || 'Your order is being processed'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery & Payment Details Grid */}
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Delivery Info Card */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck size={16} className="text-orange-500" />
                          <h3 className="font-semibold text-gray-800">Delivery Information</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                          {trackingDetails.delivery_address && (
                            <div className="flex gap-2">
                              <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                              <p className="text-gray-600">{trackingDetails.delivery_address}</p>
                            </div>
                          )}
                          {trackingDetails.tracking_number && (
                            <div className="flex gap-2">
                              <Hash size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-gray-500 text-xs">Tracking Number</p>
                                <p className="font-mono text-sm text-gray-800">{trackingDetails.tracking_number}</p>
                              </div>
                            </div>
                          )}
                          {trackingDetails.delivery_method_name && (
                            <div className="flex gap-2">
                              <Package size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-gray-500 text-xs">Delivery Method</p>
                                <p className="text-gray-800">{trackingDetails.delivery_method_name}</p>
                              </div>
                            </div>
                          )}
                          {trackingDetails.courier_name && (
                            <div className="flex gap-2">
                              <User size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-gray-500 text-xs">Courier</p>
                                <p className="text-gray-800">{trackingDetails.courier_name}</p>
                              </div>
                            </div>
                          )}
                          {trackingDetails.courier_phone && (
                            <div className="flex gap-2">
                              <Phone size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-gray-500 text-xs">Courier Phone</p>
                                <a href={`tel:${trackingDetails.courier_phone}`} className="text-orange-600 hover:underline">
                                  {trackingDetails.courier_phone}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Info Card */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard size={16} className="text-orange-500" />
                          <h3 className="font-semibold text-gray-800">Payment Information</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Payment Method</span>
                            <span className="text-gray-800">{trackingDetails.payment_provider || trackingDetails.payment_method || 'Cash on Delivery'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Total Amount</span>
                            <span className="font-bold text-orange-600">MWK {trackingDetails.total_amount?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Payment Status</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              trackingDetails.paid_at ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {trackingDetails.paid_at ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                          {trackingDetails.paid_at && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Paid On</span>
                              <span className="text-gray-600">{new Date(trackingDetails.paid_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Estimated Delivery */}
                    {(trackingDetails.estimated_delivery_from || trackingDetails.estimated_delivery_to) && (
                      <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-blue-600" />
                          <h3 className="font-semibold text-gray-800">Estimated Delivery</h3>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          {trackingDetails.estimated_delivery_from && trackingDetails.estimated_delivery_to
                            ? `${new Date(trackingDetails.estimated_delivery_from).toLocaleDateString()} - ${new Date(trackingDetails.estimated_delivery_to).toLocaleDateString()}`
                            : 'Please check back for updates'}
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-6 pt-4 text-xs text-gray-400 border-t flex flex-wrap justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Order placed: {new Date(trackingDetails.order_placed_at).toLocaleString()}</span>
                      </div>
                      {trackingDetails.delivery_created_at && (
                        <div className="flex items-center gap-1">
                          <RefreshCw size={12} />
                          <span>Last updated: {new Date(trackingDetails.delivery_created_at).toLocaleString()}</span>
                        </div>
                      )}
                      {autoRefresh && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Wifi size={12} />
                          <span>Live updates active</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t">
                      <Link
                        href={`/account/orders/${trackingDetails.order_id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                      >
                        View Order Details
                        <ArrowRight size={14} />
                      </Link>
                      {trackingDetails.order_status === 'delivered' && (
                        <Link
                          href="/products"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                        >
                          <ShoppingBag size={14} />
                          Shop Again
                        </Link>
                      )}
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Phone size={14} />
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
