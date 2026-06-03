'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  Sparkles,
  ArrowRight,
  TrendingUp,
  Gift,
  Shield
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-50' },
  processing: { label: 'Processing', icon: PackageSearch, color: 'text-blue-700', bg: 'bg-blue-50' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-700', bg: 'bg-purple-50' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
  cancelled: { label: 'Cancelled', icon: Clock, color: 'text-red-700', bg: 'bg-red-50' },
  declined: { label: 'Declined', icon: Clock, color: 'text-red-700', bg: 'bg-red-50' },
}

function formatOrderNumber(order: any): string {
  if (order.order_number && order.order_number !== 'null') {
    return order.order_number
  }
  return `#${order.id.slice(-8).toUpperCase()}`
}

function parseAmount(amount: any): number {
  if (typeof amount === 'number') return amount
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.-]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
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
  const activeOrdersCount = orders.filter(o => 
    o.status === 'shipped' || o.status === 'processing' || o.status === 'pending'
  ).length
  const totalSpent = orders.reduce((sum, o) => sum + parseAmount(o.total_amount), 0)

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner - Premium */}
      <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
                <Sparkles size={14} className="text-white" />
                <span className="text-xs font-medium text-white">Welcome Back</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                Hello, {user?.name || user?.email?.split('@')[0] || 'Guest'}
              </h1>
              <p className="text-orange-100 text-sm mt-1">Track your orders and manage your account</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <p className="text-2xl font-bold text-white">{totalSpent.toLocaleString()} MWK</p>
                <p className="text-xs text-orange-100">Lifetime Spent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Premium Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/account/orders" className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <ShoppingBag size={22} className="text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          <p className="text-sm text-gray-500">Total Orders</p>
        </Link>
        
        <Link href="/account/wishlist" className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <Heart size={22} className="text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{wishlistCount}</p>
          <p className="text-sm text-gray-500">Wishlist Items</p>
        </Link>
        
        <Link href="/account/addresses" className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <MapPin size={22} className="text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{addressesCount}</p>
          <p className="text-sm text-gray-500">Saved Addresses</p>
        </Link>
        
        <Link href="/account/orders" className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <PackageSearch size={22} className="text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeOrdersCount}</p>
          <p className="text-sm text-gray-500">Active Orders</p>
        </Link>
      </div>

      {/* Recent Orders Section - Premium */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-orange-500" />
              <h3 className="font-semibold text-gray-800">Recent Orders</h3>
            </div>
            <Link href="/account/orders" className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 group">
              View all
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500">No orders yet.</p>
            <Link href="/products" className="inline-block mt-3 text-orange-500 hover:text-orange-600 font-medium text-sm">
              Start Shopping <ArrowRight size={14} className="inline ml-1" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const StatusIcon = statusConfig.icon
              const orderDisplayNumber = formatOrderNumber(order)
              const totalAmount = parseAmount(order.total_amount)
              
              return (
                <Link 
                  key={order.id} 
                  href={`/account/orders/${order.id}`}
                  className="block p-5 hover:bg-gray-50 transition group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono text-sm font-medium text-gray-900">
                          {orderDisplayNumber}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                          <StatusIcon size={10} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          MWK {totalAmount.toLocaleString()}
                        </span>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {order.items.map((i: any) => i.product_name).join(', ')}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-orange-500 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Links - Premium Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/account/profile" className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-100 transition">
            <User size={22} className="text-gray-500 group-hover:text-orange-600 transition" />
          </div>
          <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 transition">Profile</h3>
          <p className="text-xs text-gray-400 mt-1">Manage your info</p>
        </Link>
        <Link href="/account/settings" className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-100 transition">
            <Settings size={22} className="text-gray-500 group-hover:text-orange-600 transition" />
          </div>
          <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 transition">Settings</h3>
          <p className="text-xs text-gray-400 mt-1">Preferences & security</p>
        </Link>
      </div>

      {/* Benefits Banner */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Gift size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Earn rewards with every purchase</p>
              <p className="text-xs text-gray-500">Join our loyalty program for exclusive benefits</p>
            </div>
          </div>
          <Link href="/rewards" className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
            Learn more <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
