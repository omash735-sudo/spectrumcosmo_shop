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
  User,
  Settings,
  Calendar,
  DollarSign,
} from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  processing: 'text-blue-600 bg-blue-50',
  shipped: 'text-purple-600 bg-purple-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
  declined: 'text-red-600 bg-red-50',
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'delivered') {
    return <CheckCircle size={14} className="text-green-600" />
  }
  if (status === 'shipped') {
    return <Truck size={14} className="text-purple-600" />
  }
  if (status === 'cancelled') {
    return <Clock size={14} className="text-red-600" />
  }
  return <Clock size={14} className="text-yellow-600" />
}

export default function AccountOverview() {
  const [orders, setOrders] = useState<any[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [addressesCount, setAddressesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const userRes = await fetch('/api/auth/me')
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData.user)
        }

        const ordersRes = await fetch('/api/account/orders')
        const ordersData = ordersRes.ok ? await ordersRes.json() : []
        setOrders(ordersData)

        const wishlistRes = await fetch('/api/account/wishlist')
        const wishlistData = wishlistRes.ok ? await wishlistRes.json() : []
        setWishlistCount(wishlistData.length)

        const addressesRes = await fetch('/api/account/addresses')
        const addressesData = addressesRes.ok ? await addressesRes.json() : []
        setAddressesCount(addressesData.length)
      } catch (error) {
        console.error('Failed to load overview data', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const recentOrders = [...orders].slice(0, 3)
  const activeOrdersCount = orders.filter((o) => {
    return o.status === 'shipped' || o.status === 'processing' || o.status === 'pending'
  }).length

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold">
          Hello, {user?.name || user?.email?.split('@')[0] || 'Guest'}
        </h1>
        <p className="text-gray-300 text-sm mt-1">
          Track your orders and manage your account
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/account/orders" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-orange-200 transition group">
          <ShoppingBag className="text-orange-500 mb-2 group-hover:scale-105 transition" size={24} />
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-gray-500">Total orders</p>
        </Link>
        
        <Link href="/account/wishlist" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-orange-200 transition group">
          <Heart className="text-orange-500 mb-2 group-hover:scale-105 transition" size={24} />
          <p className="text-2xl font-bold">{wishlistCount}</p>
          <p className="text-xs text-gray-500">Wishlist items</p>
        </Link>
        
        <Link href="/account/addresses" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-orange-200 transition group">
          <MapPin className="text-orange-500 mb-2 group-hover:scale-105 transition" size={24} />
          <p className="text-2xl font-bold">{addressesCount}</p>
          <p className="text-xs text-gray-500">Saved addresses</p>
        </Link>
        
        <Link href="/account/orders" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-orange-200 transition group">
          <PackageSearch className="text-orange-500 mb-2 group-hover:scale-105 transition" size={24} />
          <p className="text-2xl font-bold">{activeOrdersCount}</p>
          <p className="text-xs text-gray-500">Active orders</p>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">Recent Orders</h3>
          <Link href="/account/orders" className="text-sm text-orange-600 flex items-center gap-1 hover:gap-2 transition">
            View all <ChevronRight size={16} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-400">No orders yet.</p>
            <Link href="/products" className="inline-block mt-3 text-orange-500 text-sm hover:underline">
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link 
                key={order.id} 
                href={`/account/orders/${order.id}`}
                className="block border border-gray-100 rounded-lg p-3 hover:shadow-md transition group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 group-hover:text-orange-600 transition">
                      Order #{order.order_number || order.id.slice(0, 8)}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        Total: ${order.total_amount?.toLocaleString() || 0}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status] || 'text-gray-600 bg-gray-50'}`}>
                        <StatusIcon status={order.status} />
                        {order.status}
                      </span>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-orange-500 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/account/profile" className="bg-white p-4 rounded-xl border border-gray-100 text-center hover:border-orange-200 transition group">
          <User className="mx-auto text-gray-400 group-hover:text-orange-500 mb-1 transition" size={22} />
          <span className="text-sm">Profile</span>
        </Link>
        <Link href="/account/settings" className="bg-white p-4 rounded-xl border border-gray-100 text-center hover:border-orange-200 transition group">
          <Settings className="mx-auto text-gray-400 group-hover:text-orange-500 mb-1 transition" size={22} />
          <span className="text-sm">Settings</span>
        </Link>
      </div>
    </div>
  )
}
