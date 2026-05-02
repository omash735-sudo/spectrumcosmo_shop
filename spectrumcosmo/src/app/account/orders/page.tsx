'use client'

import { useEffect, useState } from 'react'
import AccountLayout from '@/components/account/AccountLayout'
import { Loader2, Eye, CheckCircle, Truck, Clock } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-yellow-600',
  processing: 'text-blue-600',
  shipped: 'text-purple-600',
  delivered: 'text-green-600',
  declined: 'text-red-600',
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

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'delivered') return <CheckCircle size={16} className="text-green-600" />
    if (status === 'shipped') return <Truck size={16} className="text-purple-600" />
    return <Clock size={16} className="text-yellow-600" />
  }

  if (loading) {
    return (
      <AccountLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-500" />
        </div>
      </AccountLayout>
    )
  }

  return (
    <AccountLayout>

      <h1 className="text-2xl font-bold text-[#111] mb-2">
        My Orders
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Track your purchases and delivery progress
      </p>

      {orders.length === 0 ? (
        <div className="bg-white p-6 rounded-xl border text-gray-500">
          You have no orders yet.
        </div>
      ) : (

        <div className="bg-white rounded-xl border p-6 overflow-x-auto">

          <table className="w-full text-left">

            {/* HEADER */}
            <thead className="border-b text-gray-500 text-sm">
              <tr>
                <th className="pb-3">Product</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Qty</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Tracking</th>
                <th className="pb-3"></th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b">

                  {/* PRODUCT */}
                  <td className="py-4">
                    <p className="font-medium text-[#111]">
                      {o.product_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {o.custom_details || 'No extra details'}
                    </p>
                  </td>

                  {/* DATE */}
                  <td className="py-4 text-sm">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>

                  {/* QTY */}
                  <td className="py-4 text-sm">
                    {o.quantity || 1}
                  </td>

                  {/* TOTAL */}
                  <td className="py-4 text-sm font-medium">
                    {o.total_price_usd
                      ? `$${Number(o.total_price_usd).toFixed(2)}`
                      : '-'}
                  </td>

                  {/* STATUS */}
                  <td className="py-4">
                    <span className="flex items-center gap-2 text-sm">
                      <StatusIcon status={o.status} />
                      <span className={STATUS_STYLE[o.status]}>
                        {o.status}
                      </span>
                    </span>
                  </td>

                  {/* TRACK */}
                  <td className="py-4">
                    {o.status === 'shipped' || o.status === 'delivered' ? (
                      <button className="text-orange-500 text-sm hover:underline">
                        Track
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>

                  {/* VIEW */}
                  <td className="py-4">
                    <button className="text-gray-400 hover:text-orange-500">
                      <Eye size={18} />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>
      )}

    </AccountLayout>
  )
}
