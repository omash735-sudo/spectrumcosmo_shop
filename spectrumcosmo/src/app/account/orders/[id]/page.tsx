'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Truck, Package, Clock, CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react';

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
  items_list: string;
}

interface StatusInfo {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
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

const iconMap: Record<string, any> = {
  Clock: Clock,
  CheckCircle: CheckCircle2,
  Package: Package,
  Truck: Truck,
  CheckCircle2: CheckCircle2,
  XCircle: XCircle,
  AlertTriangle: AlertCircle,
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/account/orders/${orderId}`);
        if (!res.ok) throw new Error('Failed to load order');
        const data = await res.json();
        setOrder(data.order);
        setStatusInfo(data.statusInfo);
        setHistory(data.history || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Order not found'}</p>
          <Link href="/account/orders" className="mt-4 inline-block text-orange-500 hover:underline">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const StatusIcon = statusInfo?.icon ? iconMap[statusInfo.icon] || Package : Package;

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
      <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 bg-${statusInfo?.color}-50 border border-${statusInfo?.color}-200`}>
        <StatusIcon size={24} className={`text-${statusInfo?.color}-600`} />
        <div>
          <p className={`font-semibold text-${statusInfo?.color}-700`}>{statusInfo?.name}</p>
          <p className="text-sm text-gray-600">{statusInfo?.description}</p>
        </div>
      </div>

      {/* Track Order Button - Shows dynamically based on status step_index */}
      {(statusInfo?.step_index ?? -1) >= 1 && (
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

      {/* Order Info Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Order Date:</span> {new Date(order.created_at).toLocaleString()}</p>
            <p><span className="text-gray-500">Payment Method:</span> {order.payment_method}</p>
            <p><span className="text-gray-500">Payment Status:</span> 
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </p>
            {order.paid_at && <p><span className="text-gray-500">Paid At:</span> {new Date(order.paid_at).toLocaleString()}</p>}
            {order.tracking_number && <p><span className="text-gray-500">Tracking Number:</span> <strong>{order.tracking_number}</strong></p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Delivery Information</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Customer:</span> {order.customer_name}</p>
            <p><span className="text-gray-500">Phone:</span> {order.phone_number}</p>
            <p><span className="text-gray-500">Address:</span> {order.delivery_address}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border overflow-hidden mb-8">
        <div className="px-5 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">Items</h3>
        </div>
        <div className="p-5">
          <p className="text-gray-700">{order.items_list || 'No items'}</p>
          <div className="mt-4 pt-4 border-t flex justify-between">
            <span className="font-semibold">Total Amount</span>
            <span className="font-bold text-orange-600 text-lg">MWK {order.total_amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Order Timeline (Dynamic from history) */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Order Timeline</h3>
          <div className="space-y-4">
            {history.map((event, idx) => (
              <div key={event.id} className="flex gap-3">
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full mt-1.5 bg-${event.color}-500`} />
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
        <div className="mt-6 bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <p className="text-sm text-yellow-700">
            <strong>Note from Admin:</strong> {order.admin_notes}
          </p>
        </div>
      )}

      {/* Invoice Download */}
      <div className="mt-6">
        <a
          href={`/api/orders/${orderId}/invoice`}
          download
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 transition"
        >
          <Download size={16} />
          Download Invoice (PDF)
        </a>
      </div>
    </div>
  );
}
