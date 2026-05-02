'use client'

import { useEffect, useState } from 'react'
import AccountLayout from '@/components/account/AccountLayout'
import { Loader2 } from 'lucide-react'

type Order = {
  id: string
  product_name: string
  status: 'pending' | 'approved' | 'declined' | 'shipped' | 'delivered'
  created_at: string
}

const STEPS = [
  'Order Placed',
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
]

function getStepIndex(status: string) {
  if (status === 'pending') return 0
  if (status === 'approved') return 2
  if (status === 'shipped') return 3
  if (status === 'delivered') return 4
  if (status === 'declined') return -1
  return 0
}

export default function TrackingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)

  const load = async () => {
    setLoading(true)

    const res = await fetch('/api/account/orders')
    if (res.ok) {
      setOrders(await res.json())
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const stepIndex = selected ? getStepIndex(selected.status) : -1

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
        Tracking
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Track your order progress in real time
      </p>

      <div className="grid md:grid-cols-3 gap-6">

        {/* LEFT: ORDER LIST */}
        <section className="bg-white rounded-xl border p-4 md:col-span-1">

          <h2 className="font-bold mb-4">
            My Orders
          </h2>

          {orders.length === 0 ? (
            <p className="text-sm text-gray-500">
              No orders found.
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
                    {o.product_name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {new Date(o.created_at).toLocaleString()}
                  </p>

                  <p className="text-xs mt-1 text-gray-600">
                    Status: {o.status}
                  </p>
                </button>
              ))}

            </div>
          )}

        </section>

        {/* RIGHT: TRACKING */}
        <section className="bg-white rounded-xl border p-6 md:col-span-2">

          {!selected ? (
            <p className="text-sm text-gray-500">
              Select an order to view tracking details.
            </p>
          ) : selected.status === 'declined' ? (
            <div className="text-red-600 font-medium">
              This order was declined.
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-1">
                Tracking Progress
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                {selected.product_name}
              </p>

              {/* TIMELINE */}
              <div className="space-y-6">

                {STEPS.map((step, index) => {
                  const active = index <= stepIndex

                  return (
                    <div key={step} className="flex items-center gap-3">

                      <div className="relative">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            active ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                        />

                        {index !== STEPS.length - 1 && (
                          <div
                            className={`absolute top-3 left-1.5 w-0.5 h-8 ${
                              active ? 'bg-orange-300' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>

                      <p
                        className={`text-sm font-medium ${
                          active ? 'text-black' : 'text-gray-400'
                        }`}
                      >
                        {step}
                      </p>

                    </div>
                  )
                })}

              </div>

              {/* FOOT INFO */}
              <div className="mt-8 border-t pt-4 text-xs text-gray-500">
                Order ID: {selected.id}
              </div>

            </>
          )}

        </section>

      </div>

    </AccountLayout>
  )
}
