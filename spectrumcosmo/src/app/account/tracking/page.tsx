'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, Truck, Package, CreditCard, MapPin, Hash } from 'lucide-react'

// Basic order shape returned by /api/account/orders
type BasicOrder = {
  id: string
  product_name: string
  status: 'pending' | 'approved' | 'declined' | 'shipped' | 'delivered'
  created_at: string
}

// Full tracking details returned by /api/account/orders/[id]/tracking
type TrackingDetails = {
  order_id: string
  customer_name: string
  customer_email: string
  phone_number: string
  order_status: string
  total_amount: number
  payment_method: string
  paid_at: string | null
  order_placed_at: string
  product_name: string
  unit_price: number
  quantity: number
  delivery_status: string | null
  tracking_number: string | null
  delivery_notes: string | null
  delivery_address: string | null
  delivery_created_at: string | null
  delivery_method_name: string | null
  delivery_logo: string | null
  payment_type: string | null
  payment_provider: string | null
  payment_account: string | null
}

const STEPS = [
  { label: 'Order Placed', key: 'placed' },
  { label: 'Processing', key: 'processing' },
  { label: 'Packed', key: 'packed' },
  { label: 'Shipped', key: 'shipped' },
  { label: 'Delivered', key: 'delivered' },
]

// Map order status to timeline step index
function getStepIndex(status: string) {
  switch (status) {
    case 'pending': return 0
    case 'approved': return 2
    case 'shipped': return 3
    case 'delivered': return 4
    case 'declined': return -1
    default: return 0
  }
}

export default function TrackingPage() {
  const [orders, setOrders] = useState<BasicOrder[]>([])
  const [selectedBasic, setSelectedBasic] = useState<BasicOrder | null>(null)
  const [trackingDetails, setTrackingDetails] = useState<TrackingDetails | null>(null)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  // Load basic order list
  const loadOrders = async () => {
    setLoadingOrders(true)
    try {
      const res = await fetch('/api/account/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
        if (data.length > 0) {
          setSelectedBasic(data[0])
        }
      }
    } catch (error) {
      console.error('Failed to load orders', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  // Fetch full tracking details when selected order changes
  useEffect(() => {
    if (!selectedBasic) {
      setTrackingDetails(null)
      return
    }

    const fetchTrackingDetails = async () => {
      setLoadingDetails(true)
      setDetailsError(null)
      try {
        const res = await fetch(`/api/account/orders/${selectedBasic.id}/tracking`)
        if (res.ok) {
          const data = await res.json()
          setTrackingDetails(data)
        } else if (res.status === 404) {
          setDetailsError('Order not found.')
        } else {
          setDetailsError('Failed to load tracking details.')
        }
      } catch (error) {
        console.error('Error fetching tracking details', error)
        setDetailsError('Network error. Please try again.')
      } finally {
        setLoadingDetails(false)
      }
    }

    fetchTrackingDetails()
  }, [selectedBasic])

  const stepIndex = trackingDetails ? getStepIndex(trackingDetails.order_status) : -1
  const isDeclined = trackingDetails?.order_status === 'declined'

  if (loadingOrders) {
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
        {/* Order List Sidebar */}
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
                    onClick={() => setSelectedBasic(order)}
                    className={`w-full text-left p-5 transition-all duration-200 ${
                      selectedBasic?.id === order.id
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

        {/* Tracking Details Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            {!selectedBasic ? (
              <div className="text-center py-12 text-gray-500">
                Select an order to view tracking details.
              </div>
            ) : loadingDetails ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-orange-500 w-6 h-6" />
              </div>
            ) : detailsError ? (
              <div className="text-center py-12 text-red-500">
                <p>{detailsError}</p>
                <button
                  onClick={() => {
                    // retry
                    setSelectedBasic(selectedBasic)
                  }}
                  className="mt-4 text-sm text-orange-500 underline"
                >
                  Try again
                </button>
              </div>
            ) : isDeclined && trackingDetails ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Order Declined</h3>
                <p className="text-gray-500 mt-1">This order could not be processed. Please contact support.</p>
              </div>
            ) : trackingDetails ? (
              <>
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Tracking Progress</h2>
                  <p className="text-sm text-gray-500 mt-1">{trackingDetails.product_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Order ID: {trackingDetails.order_id}</p>
                </div>

                {/* Timeline */}
                <div className="relative">
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200 -z-0" />
                  <div className="space-y-8">
                    {STEPS.map((step, idx) => {
                      const isCompleted = idx <= stepIndex
                      const isActive = idx === stepIndex && stepIndex !== -1 && stepIndex < STEPS.length - 1

                      return (
                        <div key={step.key} className="relative flex items-start gap-4">
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
                          <div className="flex-1 pt-1">
                            <p className={`font-medium ${isCompleted || isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                              {step.label}
                            </p>
                            {isActive && <p className="text-xs text-orange-500 mt-0.5">In progress</p>}
                            {isCompleted && idx === STEPS.length - 1 && (
                              <p className="text-xs text-green-600 mt-0.5">Completed!</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Delivery & Payment Details */}
                <div className="mt-10 space-y-6 border-t pt-6">
                  {/* Delivery Info */}
                  {trackingDetails.delivery_status && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex gap-3">
                        <Truck className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500">Delivery Status</p>
                          <p className="text-sm font-medium capitalize">{trackingDetails.delivery_status}</p>
                        </div>
                      </div>
                      {trackingDetails.tracking_number && (
                        <div className="flex gap-3">
                          <Hash className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Tracking Number</p>
                            <p className="text-sm font-mono">{trackingDetails.tracking_number}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {trackingDetails.delivery_address && (
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Delivery Address</p>
                        <p className="text-sm">{trackingDetails.delivery_address}</p>
                      </div>
                    </div>
                  )}

                  {trackingDetails.delivery_method_name && (
                    <div className="flex gap-3">
                      <Package className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Delivery Method</p>
                        <p className="text-sm">{trackingDetails.delivery_method_name}</p>
                      </div>
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="flex gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Payment</p>
                      <p className="text-sm">
                        {trackingDetails.payment_provider || trackingDetails.payment_method} –{' '}
                        {trackingDetails.total_amount?.toLocaleString()} (Paid{' '}
                        {trackingDetails.paid_at ? new Date(trackingDetails.paid_at).toLocaleDateString() : 'pending'})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 text-xs text-gray-400 border-t flex justify-between">
                  <span>Order placed: {new Date(trackingDetails.order_placed_at).toLocaleString()}</span>
                  {trackingDetails.delivery_created_at && (
                    <span>Last updated: {new Date(trackingDetails.delivery_created_at).toLocaleString()}</span>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
