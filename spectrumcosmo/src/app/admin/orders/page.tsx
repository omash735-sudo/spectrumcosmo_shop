'use client'
import { useState, useEffect, useCallback } from 'react'
import { Loader2, ShoppingCart, Trash2, ChevronDown, Eye, X } from 'lucide-react'
import Image from 'next/image'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/orders')
    const data = await res.json()
    setOrders(data.orders || data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    await fetchOrders()
    setUpdatingId(null)
  }

  const deleteOrder = async (id: string) => {
    if (!confirm('Delete this order permanently?')) return
    await fetch(`/api/orders?id=${id}`, { method: 'DELETE' })
    fetchOrders()
  }

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} orders total</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Product</th>
                  <th className="text-left px-6 py-3">Proof of Payment</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.phone_number}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{order.product_name}</td>
                    <td className="px-6 py-4">
                      {order.proof_of_payment_url ? (
                        <button
                          onClick={() => setPreviewImage(order.proof_of_payment_url)}
                          className="flex items-center gap-1 text-orange-600 hover:text-orange-800 text-sm"
                        >
                          <Eye size={16} /> View Proof
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No proof uploaded</span>
                      )}
                      {order.payment_note && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
                          Note: {order.payment_note}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {updatingId === order.id ? (
                        <Loader2 size={16} className="animate-spin text-orange-500" />
                      ) : (
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className={`appearance-none pr-6 pl-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}
                          >
                            {['pending', 'approved', 'declined'].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof of Payment Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700"
            >
              <X size={20} />
            </button>
            <Image
              src={previewImage}
              alt="Payment proof"
              width={800}
              height={600}
              className="object-contain w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  )
        }
