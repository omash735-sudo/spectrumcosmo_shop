'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2 } from 'lucide-react'

type Order = {
  id: string
  name: string
  phone: string
  location: string
  amount: number
  status: 'pending' | 'paid' | 'failed'
  payment_method: string
  tx_ref: string
  created_at: string
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/orders/list')
      const data = await res.json()

      setOrders(data)
    } catch (err) {
      console.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const statusStyles = (status: Order['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-5xl mx-auto px-4 space-y-6">

          {/* HEADER */}
          <div className="bg-white p-6 rounded-2xl border">
            <h1 className="text-2xl font-bold">
              Payments & Tracking
            </h1>
            <p className="text-sm text-gray-500">
              Track your SpectrumCosmo orders and payment status
            </p>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-orange-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border text-gray-500">
              No payments found yet.
            </div>
          ) : (
            <div className="space-y-4">

              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-5 rounded-xl border space-y-3"
                >

                  {/* TOP */}
                  <div className="flex justify-between items-start">

                    <div>
                      <p className="font-semibold">
                        {order.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        Order ID: {order.id}
                      </p>

                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs ${statusStyles(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>

                  </div>

                  {/* DETAILS */}
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📞 {order.phone}</p>
                    <p>📍 {order.location}</p>
                    <p>💳 {order.payment_method}</p>
                    <p>💰 MWK {order.amount.toLocaleString()}</p>
                  </div>

                  {/* TX REF */}
                  {order.tx_ref && (
                    <p className="text-xs text-gray-500">
                      TX Ref: {order.tx_ref}
                    </p>
                  )}

                  {/* STATUS MESSAGE */}
                  <div className="pt-2 border-t">

                    {order.status === 'paid' && (
                      <p className="text-green-600 text-sm">
                        ✔ Payment confirmed — order processing started
                      </p>
                    )}

                    {order.status === 'pending' && (
                      <p className="text-yellow-600 text-sm">
                        ⏳ Waiting for payment confirmation
                      </p>
                    )}

                    {order.status === 'failed' && (
                      <p className="text-red-600 text-sm">
                        ❌ Payment failed or cancelled
                      </p>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}
