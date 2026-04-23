'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2 } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
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
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-500" />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 py-10">

        <div className="max-w-5xl mx-auto px-4 space-y-6">

          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-gray-500">
            Track your purchases and delivery progress
          </p>

          {orders.length === 0 ? (
            <div className="bg-white p-6 rounded-xl text-gray-500 border">
              You have no orders yet.
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-white border rounded-xl p-5 space-y-4"
              >

                {/* HEADER */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-[#111111]">
                      {o.product_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ordered: {new Date(o.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      STATUS_STYLE[o.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {o.status}
                  </span>
                </div>

                {/* DETAILS */}
                <p className="text-sm text-gray-600">
                  {o.custom_details || 'No extra details provided'}
                </p>

                <p className="text-xs text-gray-500">
                  Quantity: {o.quantity || 1}
                </p>

                {o.total_price_usd && (
                  <p className="text-xs text-gray-500">
                    Total: ${Number(o.total_price_usd).toFixed(2)}
                  </p>
                )}

                {/* DELIVERY TIMELINE */}
                <div className="border-t pt-4 space-y-2">

                  <p className="font-semibold text-sm">
                    Delivery Tracking
                  </p>

                  {/* Step 1 */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-xs">Order placed</p>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        o.status === 'processing' ||
                        o.status === 'shipped' ||
                        o.status === 'delivered'
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-xs">Processing order</p>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        o.status === 'shipped' || o.status === 'delivered'
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-xs">Shipped</p>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        o.status === 'delivered'
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <p className="text-xs">Delivered</p>
                  </div>

                </div>

              </div>
            ))
          )}

        </div>

      </main>

      <Footer />
    </>
  )
}
