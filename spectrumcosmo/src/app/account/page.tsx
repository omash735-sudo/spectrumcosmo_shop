'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  Heart,
  MapPin,
  PackageSearch,
  ChevronRight,
  CheckCircle,
  Truck,
  Clock,
  Loader2,
} from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  processing: 'text-blue-600 bg-blue-50',
  shipped: 'text-purple-600 bg-purple-50',
  delivered: 'text-green-600 bg-green-50',
  declined: 'text-red-600 bg-red-50',
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'delivered') return <CheckCircle size={14} className="text-green-600" />
  if (status === 'shipped') return <Truck size={14} className="text-purple-600" />
  return <Clock size={14} className="text-yellow-600" />
}

export default function AccountOverview() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalOrders: 0, wishlistCount: 0, addressesCount: 0 })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch real orders from your API
        const res = await fetch('/api/account/orders')
        const ordersData = res.ok ? await res.json() : []
        setOrders(ordersData)

        // You can also fetch wishlist count, addresses count from other endpoints
        // For now, we'll use placeholder or derive from orders
        setStats({
          totalOrders: ordersData.length,
          wishlistCount: 0, // Replace with real endpoint later
          addressesCount: 0, // Replace with real endpoint later
        })
      } catch (error) {
        console.error('Failed to load overview data', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Get 3 most recent orders (assuming orders come sorted by created_at desc)
  const recentOrders = [...orders].slice(0, 3)

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold">Hello, 👋</h1>
        <p className="text-gray-300 text-sm mt-1">Track your orders and manage your account</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <ShoppingBag className="text-orange-500 mb-2" size={24} />
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
          <p className="text-xs text-gray-500">Total orders</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Heart className="text-orange-500 mb-2" size={24} />
          <p className="text-2xl font-bold">{stats.wishlistCount}</p>
          <p className="text-xs text-gray-500">Wishlist items</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <MapPin className="text-orange-500 mb-2" size={24} />
          <p className="text-2xl font-bold">{stats.addressesCount}</p>
          <p className="text-xs text-gray-500">Saved addresses</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <PackageSearch className="text-orange-500 mb-2" size={24} />
          <p className="text-2xl font-bold">
            {orders.filter(o => o.status === 'shipped' || o.status === 'processing').length}
          </p>
          <p className="text-xs text-gray-500">Active orders</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">Recent Orders</h3>
          <Link href="/account/orders" className="text-sm text-orange-600 flex items-center gap-1">
            View all <ChevronRight size={16} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-center text-gray-400 py-6">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="border border-gray-100 rounded-lg p-3 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{order.product_name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span>📅 {new Date(order.created_at).toLocaleDateString()}</span>
                      <span>🔢 Qty: {order.quantity || 1}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status] || 'text-gray-600 bg-gray-50'}`}>
                        <StatusIcon status={order.status} />
                        {order.status}
                      </span>
                    </div>
                    {order.custom_details && (
                      <p className="text-xs text-gray-400 mt-1">{order.custom_details}</p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links to other sections */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/account/wishlist" className="bg-white p-4 rounded-xl border border-gray-100 text-center hover:border-orange-200 transition group">
          <Heart className="mx-auto text-gray-400 group-hover:text-orange-500 mb-1" size={22} />
          <span className="text-sm">Wishlist</span>
        </Link>
        <Link href="/account/addresses" className="bg-white p-4 rounded-xl border border-gray-100 text-center hover:border-orange-200 transition group">
          <MapPin className="mx-auto text-gray-400 group-hover:text-orange-500 mb-1" size={22} />
          <span className="text-sm">Addresses</span>
        </Link>
      </div>
    </div>
  )
                                                                                        }
