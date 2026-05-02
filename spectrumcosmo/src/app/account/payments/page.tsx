'use client'

import { useEffect, useState } from 'react'
import AccountLayout from '@/components/account/AccountLayout'
import { Loader2, CreditCard } from 'lucide-react'

type Order = {
  id: string
  name: string
  phone: string
  location: string
  amount: number
  status: 'pending' | 'paid' | 'failed'
  payment_method: string
  created_at: string
  tx_ref?: string
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export default function AccountPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)

  const load = async () => {
    setLoading(true)

    const res = await fetch('/api/orders/list')

    if (res.ok) {
      setOrders(await res.json())
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

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
        Payments & Orders
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        View payment status and transaction history
      </p>

      <div className="grid md:grid-cols-3 gap-6">

        {/* LEFT: ORDER LIST */}
        <section className="bg-white rounded-xl border p-4 md:col-span-1">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <CreditCard size={18} />
            Orders
          </h2>

          {orders.length === 0 ? (
            <p className="text-sm text-gray-500">
              No orders yet.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className={`w-full text-left p-3 rounded-lg border transition hover:bg-gray-50 ${
                    selected?.id === o.id
                      ? 'border-orange-500'
                      : 'border-gray-200'
                  }`}
                >
                  <p className="text-sm font-medium text-[#111]">
                    {o.id}
                  </p>

                  <p className="text-xs text-gray-500">
                    MWK {o.amount.toLocaleString()}
                  </p>

                  <span
                    className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                      STATUS_STYLE[o.status]
                    }`}
                  >
                    {o.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT: DETAILS */}
        <section className="bg-white rounded-xl border p-6 md:col-span-2">

          {!selected ? (
            <p className="text-sm text-gray-500">
              Select an order to view payment details.
            </p>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2">
                Payment Details
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                Order ID: {selected.id}
              </p>

              {/* TIMELINE */}
              <div className="space-y-4 mb-6">

                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <p className="text-sm">Order Created</p>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      selected.status !== 'failed'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                  <p className="text-sm">Payment Processing</p>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      selected.status === 'paid'
                        ? 'bg-green-500'
                        : selected.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-gray-300'
                    }`}
                  />
                  <p className="text-sm">Final Status</p>
                </div>

              </div>

              {/* DETAILS */}
              <div className="text-sm text-gray-600 space-y-2 border-t pt-4">

                <p>
                  Method: <b>{selected.payment_method}</b>
                </p>

                <p>
                  Amount: <b>MWK {selected.amount.toLocaleString()}</b>
                </p>

                <p>
                  Date: {new Date(selected.created_at).toLocaleString()}
                </p>

                {selected.tx_ref && (
                  <p>
                    TX Ref: {selected.tx_ref}
                  </p>
                )}

              </div>

            </>
          )}

        </section>

      </div>

    </AccountLayout>
  )
}
