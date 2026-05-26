'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Truck, Package, Clock, CheckCircle2, XCircle, AlertCircle, Download, Eye, MapPin, Phone, Calendar, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  delivery_address: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  paid_at: string | null;
  tracking_number: string | null;
  tracking_notes: string | null;
  admin_notes: string | null;
  delivered_at: string | null;
  items_list?: string;
  items?: Array<{ product_name?: string; name?: string; quantity: number; unit_price_usd?: number; price?: number }>;
}

interface Receipt {
  id: number;
  imageUrl: string;
  image_url?: string;
  extractedData: {
    parcelId: string;
    receiverName: string;
    receiverPhone: string;
    receiverCity: string;
    totalAmount: number;
    paymentStatus: string;
    truckNumber?: string;
    deliveryCounter?: string;
    dateTime?: string;
  };
  extracted_data?: any;
  created_at: string;
}

interface StatusInfo {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon?: string;
  step_index: number;
}

interface StatusHistory {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  notes: string;
  changed_at: string;
  status_name: string;
  color: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  in_transit: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/account/orders/${orderId}`);
      if (!res.ok) throw new Error('Failed to load order');
      const data = await res.json();
      setOrder(data.order);
      setStatusInfo(data.statusInfo);
      setHistory(data.history || []);
      
      // Fetch receipt if exists
      const receiptRes = await fetch(`/api/account/orders/${orderId}/receipt`);
      if (receiptRes.ok) {
        const receiptData = await receiptRes.json();
        if (receiptData.receipt) {
          setReceipt(receiptData.receipt);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const res = await fetch(`/api/account/orders/${orderId}/receipt?download=true`);
      if (!res.ok) throw new Error('Failed to generate PDF');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${orderId.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast.error('Failed to download receipt');
    }
  };

  const handleDownloadInvoice = async () => {
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
    } catch (err) {
      toast.error('Failed to download invoice');
    }
  };

  const handleConfirmDelivery = async (response: 'received' | 'not_received') => {
    setConfirming(true);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.message);
      setShowConfirmModal(false);
      
      if (data.redirectTo) {
        router.push(data.redirectTo);
      } else {
        fetchOrderDetails();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const getItemsList = () => {
    if (order?.items && order.items.length > 0) {
      return order.items.map(item => {
        const name = item.product_name || item.name || 'Product';
        const price = item.unit_price_usd || item.price || 0;
        return `${name} x${item.quantity} - MWK ${(price * item.quantity).toLocaleString()}`;
      }).join(', ');
    }
    return order?.items_list || 'No items';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Order not found</p>
          <Link href="/account/orders" className="mt-4 inline-block text-orange-500 hover:underline">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = statusColors[order.status] || 'bg-gray-100 text-gray-800 border-gray-200';
  const showTrackButton = ['approved', 'processing', 'in_transit', 'delivered'].includes(order.status);
  const showConfirmButton = order.status === 'delivered' && receipt?.extractedData?.paymentStatus !== 'paid';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/account/orders" className="text-orange-500 hover:underline text-sm mb-4 inline-block">
          ← Back to Orders
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        <p className="text-gray-500 text-sm">Order #{order.order_number || order.id.slice(-8)}</p>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 border ${statusColor}`}>
        {order.status === 'delivered' && <CheckCircle2 size={24} />}
        {order.status === 'in_transit' && <Truck size={24} />}
        {order.status === 'processing' && <Package size={24} />}
        {order.status === 'pending' && <Clock size={24} />}
        {(order.status === 'cancelled' || order.status === 'declined') && <XCircle size={24} />}
        <div>
          <p className="font-semibold">{statusInfo?.name || order.status}</p>
          <p className="text-sm opacity-80">{statusInfo?.description || `Order is ${order.status}`}</p>
        </div>
      </div>

      {/* Track Order Button */}
      {showTrackButton && (
        <div className="mb-6">
          <Link
            href={`/account/orders/${orderId}/tracking`}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition"
          >
            <Truck size={18} />
            Track Your Order
          </Link>
        </div>
      )}

      {/* Confirm Delivery Button */}
      {showConfirmButton && (
        <div className="mb-6">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition"
          >
            <CheckCircle2 size={18} />
            Confirm Delivery
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Did you receive your order? Let us know to complete the process.
          </p>
        </div>
      )}

      {/* Order Info Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <Calendar size={14} className="text-gray-400 mt-0.5" />
              <span className="text-gray-500">Order Date:</span>
              <span className="text-gray-700">{new Date(order.created_at).toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <DollarSign size={14} className="text-gray-400 mt-0.5" />
              <span className="text-gray-500">Payment Method:</span>
              <span className="text-gray-700">{order.payment_method}</span>
            </div>
            <div className="flex gap-2">
              <Clock size={14} className="text-gray-400 mt-0.5" />
              <span className="text-gray-500">Payment Status:</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
            {order.paid_at && (
              <div className="flex gap-2">
                <Calendar size={14} className="text-gray-400 mt-0.5" />
                <span className="text-gray-500">Paid At:</span>
                <span className="text-gray-700">{new Date(order.paid_at).toLocaleString()}</span>
              </div>
            )}
            {order.tracking_number && (
              <div className="flex gap-2">
                <Truck size={14} className="text-gray-400 mt-0.5" />
                <span className="text-gray-500">Tracking Number:</span>
                <span className="text-gray-700 font-mono text-xs">{order.tracking_number}</span>
              </div>
            )}
            {order.tracking_notes && (
              <div className="flex gap-2 mt-2">
                <span className="text-gray-500">Tracking Notes:</span>
                <span className="text-gray-600 text-xs">{order.tracking_notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Delivery Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-24">Customer:</span>
              <span className="text-gray-700">{order.customer_name}</span>
            </div>
            <div className="flex gap-2">
              <Phone size={14} className="text-gray-400 mt-0.5" />
              <span className="text-gray-500 w-24">Email:</span>
              <span className="text-gray-700">{order.customer_email}</span>
            </div>
            <div className="flex gap-2">
              <Phone size={14} className="text-gray-400 mt-0.5" />
              <span className="text-gray-500 w-24">Phone:</span>
              <span className="text-gray-700">{order.phone_number}</span>
            </div>
            <div className="flex gap-2">
              <MapPin size={14} className="text-gray-400 mt-0.5" />
              <span className="text-gray-500 w-24">Address:</span>
              <span className="text-gray-700">{order.delivery_address}</span>
            </div>
            {order.delivered_at && (
              <div className="flex gap-2 mt-2">
                <CheckCircle2 size={14} className="text-green-500 mt-0.5" />
                <span className="text-gray-500">Delivered At:</span>
                <span className="text-gray-700">{new Date(order.delivered_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Section */}
      {receipt && (
        <div className="bg-white rounded-xl border overflow-hidden mb-8">
          <div className="px-5 py-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Delivery Receipt</h3>
            <button
              onClick={handleDownloadReceipt}
              className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm"
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Parcel ID</p>
                <p className="font-mono text-sm">{receipt.extractedData?.parcelId || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Receiver</p>
                <p>{receipt.extractedData?.receiverName || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Receiver Phone</p>
                <p>{receipt.extractedData?.receiverPhone || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Receiver City</p>
                <p>{receipt.extractedData?.receiverCity || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Total Amount</p>
                <p className="font-semibold">MWK {receipt.extractedData?.totalAmount?.toLocaleString() || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Payment Status</p>
                <p className={receipt.extractedData?.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}>
                  {receipt.extractedData?.paymentStatus === 'paid' ? 'Paid' : 'COD - Pay at Collection'}
                </p>
              </div>
              {receipt.extractedData?.truckNumber && (
                <div>
                  <p className="text-gray-400 text-xs">Truck Number</p>
                  <p>{receipt.extractedData.truckNumber}</p>
                </div>
              )}
              {receipt.extractedData?.deliveryCounter && (
                <div>
                  <p className="text-gray-400 text-xs">Delivery Counter</p>
                  <p>{receipt.extractedData.deliveryCounter}</p>
                </div>
              )}
              {receipt.extractedData?.dateTime && (
                <div>
                  <p className="text-gray-400 text-xs">Receipt Date</p>
                  <p>{new Date(receipt.extractedData.dateTime).toLocaleString()}</p>
                </div>
              )}
            </div>
            {(receipt.imageUrl || receipt.image_url) && (
              <div className="mt-4">
                <button
                  onClick={() => window.open(receipt.imageUrl || receipt.image_url, '_blank')}
                  className="flex items-center gap-1 text-orange-500 text-sm hover:underline"
                >
                  <Eye size={14} /> View Original Receipt
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl border overflow-hidden mb-8">
        <div className="px-5 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">Items</h3>
        </div>
        <div className="divide-y">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => {
              const name = item.product_name || item.name || 'Product';
              const price = item.unit_price_usd || item.price || 0;
              return (
                <div key={idx} className="p-5 flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{name}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900">MWK {(price * item.quantity).toLocaleString()}</p>
                </div>
              );
            })
          ) : (
            <div className="p-5">
              <p className="text-gray-700">{order.items_list || 'No items'}</p>
            </div>
          )}
          <div className="p-5 border-t bg-gray-50 flex justify-between">
            <span className="font-bold text-gray-900">Total Amount</span>
            <span className="font-bold text-orange-600 text-lg">MWK {order.total_amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border p-5 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Order Timeline</h3>
          <div className="space-y-4">
            {history.map((event, idx) => (
              <div key={event.id} className="flex gap-3">
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full mt-1.5 bg-${event.color || 'gray'}-500`} />
                  {idx < history.length - 1 && <div className="absolute top-5 left-1 w-0.5 h-full bg-gray-200 -translate-x-1/2" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-gray-900">{event.status_name || event.new_status}</p>
                  <p className="text-xs text-gray-400">{new Date(event.changed_at).toLocaleString()}</p>
                  {event.notes && <p className="text-sm text-gray-500 mt-1">{event.notes}</p>}
                  <p className="text-xs text-gray-400 mt-1">by {event.changed_by}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Notes */}
      {order.admin_notes && (
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 mb-8">
          <p className="text-sm text-yellow-700">
            <strong>Note from Admin:</strong> {order.admin_notes}
          </p>
        </div>
      )}

      {/* Invoice Download */}
      <div className="mt-6">
        <button
          onClick={handleDownloadInvoice}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 transition"
        >
          <Download size={16} />
          Download Invoice (PDF)
        </button>
      </div>

      {/* Confirm Delivery Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Delivery</h2>
            <p className="text-gray-600 mb-6">
              Did you receive your order from {order.customer_name}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleConfirmDelivery('received')}
                disabled={confirming}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition disabled:opacity-50"
              >
                {confirming ? <Loader2 className="animate-spin inline mr-2" size={16} /> : <CheckCircle2 size={16} className="inline mr-2" />}
                Yes, I Received It
              </button>
              <button
                onClick={() => handleConfirmDelivery('not_received')}
                disabled={confirming}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                No, Not Received
              </button>
            </div>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="w-full mt-3 text-gray-500 text-sm py-2 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
