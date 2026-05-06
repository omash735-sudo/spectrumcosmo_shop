'use client'

import { useEffect, useState } from 'react'
import { Loader2, Eye, CheckCircle, Truck, Clock, Package } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  processing: 'text-blue-600 bg-blue-50',
  shipped: 'text-purple-600 bg-purple-50',
  delivered: 'text-green-600 bg-green-50',
  declined: 'text-red-600 bg-red-50',
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'delivered') return <CheckCircle size={16} className="text-green-600" />
  if (status === 'shipped') return <Truck size={16} className="text-purple-600" />
  return <Clock size={16} className="text-yellow-600" />
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/account/orders')
    const data = res.ok ? await res.json() : []
    setOrders(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    )
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
          {/* DESKTOP TABLE (hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-sm">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Qty</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Tracking</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{o.product_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {o.custom_details || 'No extra details'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{o.quantity || 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {o.total_price_usd ? `$${Number(o.total_price_usd).toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[o.status] || 'text-gray-600 bg-gray-50'}`}>
                          <StatusIcon status={o.status} />
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {o.status === 'shipped' || o.status === 'delivered' ? (
                          <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                            Track
                          </button>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-gray-400 hover:text-orange-500 transition">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS (visible only on small screens) */}
          <div className="md:hidden space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{o.product_name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{o.custom_details || 'No extra details'}</p>
                  </div>
                  <button className="text-gray-400 hover:text-orange-500">
                    <Eye size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm mt-2">
                  <div>
                    <span className="text-xs text-gray-400">Date</span>
                    <p className="text-gray-700">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Quantity</span>
                    <p className="text-gray-700">{o.quantity || 1}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Total</span>
                    <p className="font-medium text-gray-800">
                      {o.total_price_usd ? `$${Number(o.total_price_usd).toFixed(2)}` : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Status</span>
                    <div className="mt-0.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[o.status] || 'text-gray-600 bg-gray-50'}`}>
                        <StatusIcon status={o.status} />
                        {o.status}
                      </span>
                    </div>
                  </div>
                </div>
                {(o.status === 'shipped' || o.status === 'delivered') && (
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
  )
}
