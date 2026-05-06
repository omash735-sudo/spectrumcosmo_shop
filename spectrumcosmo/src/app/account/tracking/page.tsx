'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

type Order = {
  id: string
  product_name: string
  status: 'pending' | 'approved' | 'declined' | 'shipped' | 'delivered'
  created_at: string
}

const STEPS = [
  { label: 'Order Placed', key: 'placed' },
  { label: 'Processing', key: 'processing' },
  { label: 'Packed', key: 'packed' },
  { label: 'Shipped', key: 'shipped' },
  { label: 'Delivered', key: 'delivered' },
]

// Map status to step index (0-based)
function getStepIndex(status: string) {
  switch (status) {
    case 'pending': return 0
    case 'approved': return 2  // after processing
    case 'shipped': return 3
    case 'delivered': return 4
    case 'declined': return -1
    default: return 0
  }
}

export default function TrackingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/account/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
        if (data.length > 0) setSelected(data[0]) // auto-select first order
      }
    } catch (error) {
      console.error('Failed to load orders', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stepIndex = selected ? getStepIndex(selected.status) : -1
  const isDeclined = selected?.status === 'declined'

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Track Your Orders
        </h1>
        <p className="text-gray-500 mt-1">Real‑time updates on every step of your order journey</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50/40">
              <h2 className="font-semibold text-gray-800">My Orders</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No orders found.
                </div>
              ) : (
                orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelected(order)}
                    className={`w-full text-left p-5 transition-all duration-200 ${
                      selected?.id === order.id
                        ? 'bg-orange-50/40 border-l-4 border-orange-500 shadow-inner'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {order.product_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'declined'
                            ? 'bg-red-100 text-red-700'
                            : order.status === 'shipped'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            {!selected ? (
              <div className="text-center py-12 text-gray-500">
                Select an order to view tracking details.
              </div>
            ) : isDeclined ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Order Declined</h3>
                <p className="text-gray-500 mt-1">This order could not be processed. Please contact support.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Tracking Progress</h2>
                  <p className="text-sm text-gray-500 mt-1">{selected.product_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Order ID: {selected.id}</p>
                </div>

                {/* Modern Timeline */}
                <div className="relative">
                  {/* Vertical line connector */}
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200 -z-0" />

                  <div className="space-y-8">
                    {STEPS.map((step, idx) => {
                      const isCompleted = idx <= stepIndex
                      const isCurrent = idx === stepIndex && !isCompleted // current step (not yet completed? Actually if stepIndex = idx, it's active/completed? We'll treat completed if idx <= stepIndex)
                      // For a more nuanced "current" step: if idx === stepIndex, and stepIndex < 4, show as active processing.
                      const isActive = idx === stepIndex && stepIndex !== -1 && stepIndex < STEPS.length - 1
                      
                      return (
                        <div key={step.key} className="relative flex items-start gap-4">
                          {/* Icon Circle */}
                          <div className="relative z-10">
                            {isCompleted && stepIndex >= idx ? (
                              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              </div>
                            ) : isActive ? (
                              <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-500 flex items-center justify-center animate-pulse">
                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Step Text */}
                          <div className="flex-1 pt-1">
                            <p
                              className={`font-medium ${
                                isCompleted || isActive ? 'text-gray-900' : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </p>
                            {isActive && (
                              <p className="text-xs text-orange-500 mt-0.5">In progress</p>
                            )}
                            {isCompleted && stepIndex === idx && idx === STEPS.length - 1 && (
                              <p className="text-xs text-green-600 mt-0.5">Completed!</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Additional info */}
                <div className="mt-10 pt-6 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
                  <span>Last updated: {new Date().toLocaleString()}</span>
                  <span className="font-mono">ID: {selected.id.slice(-8)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
