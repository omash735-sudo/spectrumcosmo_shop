'use client';

import { useEffect, useState } from 'react';
import { Loader2, Eye, CheckCircle, Truck, Clock, Package, XCircle } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  processing: 'text-blue-600 bg-blue-50',
  shipped: 'text-purple-600 bg-purple-50',
  delivered: 'text-green-600 bg-green-50',
  declined: 'text-red-600 bg-red-50',
  cancelled: 'text-gray-600 bg-gray-100',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'delivered') return <CheckCircle size={16} className="text-green-600" />;
  if (status === 'shipped') return <Truck size={16} className="text-purple-600" />;
  if (status === 'cancelled') return <XCircle size={16} className="text-gray-500" />;
  return <Clock size={16} className="text-yellow-600" />;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/account/orders');
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/account/orders?id=${orderId}&action=cancel`, { method: 'PATCH' });
      if (res.ok) {
        await loadOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to cancel order');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h1>
      <p className="text-sm text-gray-500 mb-6">Track your purchases and delivery progress</p>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500 shadow-sm">
          <Package className="mx-auto text-gray-300 mb-2" size={40} />
          You have no orders yet.
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-sm">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order #</th>
                    <th className="px-4 py-3 font-medium">Products</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 font-mono text-sm">
                        #{order.order_number?.slice(-8) || order.id.slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item: any) => (
                              <div key={item.id} className="text-sm text-gray-800">
                                {item.product_name} x{item.quantity}
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        MWK {Number(order.total_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[order.status] || 'text-gray-600 bg-gray-50'}`}>
                          <StatusIcon status={order.status} />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="text-gray-400 hover:text-orange-500 transition">
                            <Eye size={18} />
                          </button>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => cancelOrder(order.id)}
                              disabled={cancellingId === order.id}
                              className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                            >
                              {cancellingId === order.id ? '...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-400">
                      #{order.order_number?.slice(-8) || order.id.slice(-8)}
                    </p>
                    <h3 className="font-semibold text-gray-800 mt-1">
                      {order.items && order.items.length > 0
                        ? order.items.map((i: any) => i.product_name).join(', ')
                        : 'Order'}
                    </h3>
                  </div>
                  <button className="text-gray-400 hover:text-orange-500">
                    <Eye size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm mt-2">
                  <div>
                    <span className="text-xs text-gray-400">Date</span>
                    <p className="text-gray-700">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Total</span>
                    <p className="font-medium text-gray-800">MWK {Number(order.total_amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Status</span>
                    <div className="mt-0.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[order.status] || 'text-gray-600 bg-gray-50'}`}>
                        <StatusIcon status={order.status} />
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
                {order.status === 'pending' && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    disabled={cancellingId === order.id}
                    className="mt-3 w-full border border-red-200 text-red-600 text-sm py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
                {(order.status === 'shipped' || order.status === 'delivered') && (
                  <button className="mt-3 w-full border border-orange-200 text-orange-600 text-sm py-2 rounded-lg hover:bg-orange-50 transition">
                    Track Order
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
