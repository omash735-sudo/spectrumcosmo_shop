'use client'
import { useState } from 'react'
import { ShoppingCart, ChevronDown, X, Eye } from 'lucide-react'

const STATUSES = ['pending', 'processing', 'completed']
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

export default function AdminOrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
        if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status }))
      }
    } finally { setUpdating(null) }
  }

  return (
    <div className="pt-16 lg:pt-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} orders total</p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-2">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === s ? 'bg-[#F97316] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-200'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <ShoppingCart size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400">No orders found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Product</th>
                  <th className="text-left px-6 py-3">Payment</th>
                  <th className="text-left px-6 py-3">Delivery</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-[#111111]">{o.customer_name}</p>
                      <p className="text-xs text-gray-400">{o.phone_number}</p>
                      {o.email && <p className="text-xs text-gray-400">{o.email}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[150px] truncate">{o.product_name}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{o.payment_method || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{o.delivery_method || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <select
                          value={o.status}
                          disabled={updating === o.id}
                          onChange={e => updateStatus(o.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer appearance-none pr-6 ${STATUS_COLORS[o.status]}`}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelected(o)}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-[#F97316] transition-all">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-[#111111]">Order Details</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Customer', value: selected.customer_name },
                  { label: 'Phone', value: selected.phone_number },
                  { label: 'Email', value: selected.email || '—' },
                  { label: 'Product', value: selected.product_name },
                  { label: 'Payment', value: selected.payment_method || '—' },
                  { label: 'Delivery', value: selected.delivery_method || '—' },
                  { label: 'Amount', value: selected.total_amount ? `MWK ${Number(selected.total_amount).toLocaleString()}` : '—' },
                  { label: 'Date', value: new Date(selected.created_at).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <p className="text-sm font-medium text-[#111111]">{value}</p>
                  </div>
                ))}
              </div>
              {selected.custom_details && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Custom Details</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selected.custom_details}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-2">Update Status</p>
                <div className="flex gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                        selected.status === s
                          ? 'bg-[#F97316] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-[#F97316]'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
