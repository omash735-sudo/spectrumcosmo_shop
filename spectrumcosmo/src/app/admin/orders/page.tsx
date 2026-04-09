'use client'
import { useState, useEffect, useCallback } from 'react'
import { Loader2, ShoppingCart, Trash2, ChevronDown } from 'lucide-react'

const STATUS_STYLES: Record<string,string> = {
  pending:'bg-yellow-100 text-yellow-700',
  approved:'bg-green-100 text-green-700',
  declined:'bg-red-100 text-red-700',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string|null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/orders')
    setOrders(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    await fetch('/api/orders', {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,status})})
    await fetch_()
    setUpdatingId(null)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this order?')) return
    await fetch(`/api/orders?id=${id}`, {method:'DELETE'})
    fetch_()
  }

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8"><h1 className="text-2xl font-bold text-[#111111]">Orders</h1><p className="text-gray-500 text-sm mt-1">{orders.length} orders total</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#F97316]" size={32}/></div>
        : orders.length===0 ? <div className="text-center py-20"><ShoppingCart size={40} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-400">No orders yet.</p></div>
        : <div className="overflow-x-auto"><table className="w-full">
            <thead><tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
              <th className="text-left px-6 py-3">Customer</th><th className="text-left px-6 py-3">Product</th>
              <th className="text-left px-6 py-3">Details</th><th className="text-left px-6 py-3">Qty/Total</th><th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Date</th><th className="text-right px-6 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((o:any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><p className="font-medium text-sm text-[#111111]">{o.customer_name}</p><p className="text-xs text-gray-400">{o.phone_number}</p></td>
                  <td className="px-6 py-4 text-sm text-gray-700">{o.product_name}</td>
                  <td className="px-6 py-4 max-w-[200px]">{o.custom_details?<p className="text-xs text-gray-500 truncate">{o.custom_details}</p>:<span className="text-xs text-gray-300">—</span>}</td>
                  <td className="px-6 py-4 text-xs text-gray-600">{o.quantity || 1}{o.total_price_usd ? ` / $${Number(o.total_price_usd).toFixed(2)}` : ''}</td>
                  <td className="px-6 py-4">
                    {updatingId===o.id ? <Loader2 size={16} className="animate-spin text-[#F97316]"/>
                    : <div className="relative inline-block">
                        <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)} className={`appearance-none pr-6 pl-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-700'}`}>
                          {['pending','approved','declined'].map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"/>
                      </div>}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><div className="flex justify-end"><button onClick={()=>del(o.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15}/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table></div>}
      </div>
    </div>
  )
}
