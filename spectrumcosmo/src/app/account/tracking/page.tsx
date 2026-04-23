'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2 } from 'lucide-react'

type Order = {
  id: string
  product_name: string
  status: 'pending' | 'approved' | 'declined' | string
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
      const data = await res.json()
      setOrders(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-600" />
        </main>
        <Footer />
      </>
    )
  }

  const stepIndex = selected ? getStepIndex(selected.status) : -1

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">

          {/* ORDER LIST */}
          <section className="bg-white rounded-2xl border p-4 md:col-span-1">
            <h2 className="font-bold mb-4">My Orders</h2>

            {orders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders found.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className={`w-full text-left p-3 rounded-lg border hover:bg-gray-50 ${
                      selected?.id === o.id ? 'border-orange-500' : ''
                    }`}
                  >
                    <p className="font-medium text-sm">{o.product_name}</p>
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

          {/* TRACKING DETAILS */}
          <section className="bg-white rounded-2xl border p-6 md:col-span-2">
            {!selected ? (
              <p className="text-gray-500 text-sm">
                Select an order to view tracking details.
              </p>
            ) : selected.status === 'declined' ? (
              <div className="text-red-600 font-medium">
                This order was declined.
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1">
                  Tracking Order
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
                        <div
                          className={`w-4 h-4 rounded-full ${
                            active ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                        />
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              active ? 'text-black' : 'text-gray-400'
                            }`}
                          >
                            {step}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* EXTRA INFO */}
                <div className="mt-8 text-xs text-gray-500">
                  Order ID: {selected.id}
                </div>
              </>
            )}
          </section>

        </div>
      </main>

      <Footer />
    </>
  )
}
