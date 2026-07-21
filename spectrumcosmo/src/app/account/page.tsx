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
  // DollarSign removed
  ArrowRight,
  TrendingUp,
  Gift,
  Shield
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
  processing: { label: 'Processing', icon: PackageSearch, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
  cancelled: { label: 'Cancelled', icon: Clock, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
  declined: { label: 'Declined', icon: Clock, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
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
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
          <p className="text-[var(--foreground-muted)] text-sm sm:text-base">Loading your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-8">
      
      {/* ============================================
          WELCOME BANNER - With Manga Panel
          ============================================ */}
      <div className="manga-bg hero-manga rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
        <div className="relative z-10 bg-[var(--primary)]/95 p-5 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[var(--background-card)]/20 backdrop-blur-sm px-2.5 sm:px-3 py-1 rounded-full mb-2 sm:mb-3">
                {/* Sparkles removed */}
                <span className="text-[10px] sm:text-xs font-bold text-white">Welcome Back</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--foreground)]">
                Hello, {user?.name || user?.email?.split('@')[0] || 'Guest'}
              </h1>
              <p className="text-[var(--foreground-muted)] text-xs sm:text-sm mt-1">Track your orders and manage your account</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-center">
                <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{totalSpent.toLocaleString()} MWK</p>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Lifetime Spent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          STATS CARDS - Clean (No Manga)
          ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/account/orders" className="group bg-[var(--background-card)] rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-[var(--border)] hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary)]/10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition">
            <ShoppingBag size={18} className="text-[var(--primary)] sm:w-5 sm:h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">{orders.length}</p>
          <p className="text-[11px] sm:text-sm text-[var(--foreground-muted)]">Total Orders</p>
        </Link>
        
        <Link href="/account/wishlist" className="group bg-[var(--background-card)] rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-[var(--border)] hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary)]/10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition">
            <Heart size={18} className="text-[var(--primary)] sm:w-5 sm:h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">{wishlistCount}</p>
          <p className="text-[11px] sm:text-sm text-[var(--foreground-muted)]">Wishlist Items</p>
        </Link>
        
        <Link href="/account/addresses" className="group bg-[var(--background-card)] rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-[var(--border)] hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary)]/10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition">
            <MapPin size={18} className="text-[var(--primary)] sm:w-5 sm:h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">{addressesCount}</p>
          <p className="text-[11px] sm:text-sm text-[var(--foreground-muted)]">Saved Addresses</p>
        </Link>
        
        <Link href="/account/orders" className="group bg-[var(--background-card)] rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm border border-[var(--border)] hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-200 hover:-translate-y-0.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary)]/10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition">
            <PackageSearch size={18} className="text-[var(--primary)] sm:w-5 sm:h-5" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">{activeOrdersCount}</p>
          <p className="text-[11px] sm:text-sm text-[var(--foreground-muted)]">Active Orders</p>
        </Link>
      </div>

      {/* ============================================
          RECENT ORDERS SECTION - Clean (No Manga)
          ============================================ */}
      <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-5 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingUp size={16} className="text-[var(--primary)] sm:w-[18px] sm:h-[18px]" />
              <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">Recent Orders</h3>
            </div>
            <Link href="/account/orders" className="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium flex items-center gap-1 group">
              View all
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <ShoppingBag size={24} className="text-[var(--foreground-muted)] sm:w-8 sm:h-8" />
            </div>
            <p className="text-[var(--foreground-muted)] text-sm">No orders yet.</p>
            <Link href="/products" className="inline-block mt-2 sm:mt-3 text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium text-xs sm:text-sm">
              Start Shopping <ArrowRight size={12} className="inline ml-1" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {recentOrders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const StatusIcon = statusConfig.icon
              const orderDisplayNumber = formatOrderNumber(order)
              const totalAmount = parseAmount(order.total_amount)
              
              return (
                <Link 
                  key={order.id} 
                  href={`/account/orders/${order.id}`}
                  className="block p-4 sm:p-5 hover:bg-[var(--background-secondary)] transition group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <p className="font-mono text-xs sm:text-sm font-medium text-[var(--foreground)]">
                          {orderDisplayNumber}
                        </p>
                        <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                          <StatusIcon size={9} className="sm:w-2.5 sm:h-2.5" />
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-1.5 sm:mt-2">
                        <span className="flex items-center gap-0.5 sm:gap-1">
                          <Calendar size={10} className="sm:w-3 sm:h-3" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        {/* DollarSign removed - now just the amount */}
                        <span className="font-medium text-[var(--foreground)]">
                          MWK {totalAmount.toLocaleString()}
                        </span>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]/60 mt-1 line-clamp-1">
                          {order.items.map((i: any) => i.product_name).join(', ')}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition-transform group-hover:translate-x-0.5 sm:w-4 sm:h-4" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ============================================
          QUICK LINKS - Clean (No Manga)
          ============================================ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link href="/account/profile" className="group bg-[var(--background-card)] rounded-lg sm:rounded-xl p-3 sm:p-5 border border-[var(--border)] shadow-sm hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-200 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--background-secondary)] rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-[var(--primary)]/10 transition">
            <User size={18} className="text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition sm:w-5 sm:h-5" />
          </div>
          <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition text-sm sm:text-base">Profile</h3>
          <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5 sm:mt-1">Manage your info</p>
        </Link>
        <Link href="/account/settings" className="group bg-[var(--background-card)] rounded-lg sm:rounded-xl p-3 sm:p-5 border border-[var(--border)] shadow-sm hover:shadow-md hover:border-[var(--primary)]/30 transition-all duration-200 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--background-secondary)] rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-[var(--primary)]/10 transition">
            <Settings size={18} className="text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition sm:w-5 sm:h-5" />
          </div>
          <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition text-sm sm:text-base">Settings</h3>
          <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5 sm:mt-1">Preferences & security</p>
        </Link>
      </div>

      {/* ============================================
          BENEFITS BANNER - Clean (No Manga)
          ============================================ */}
      <div className="bg-[var(--background-secondary)] rounded-lg sm:rounded-xl p-3.5 sm:p-5 border border-[var(--border)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
              <Gift size={14} className="text-[var(--primary)] sm:w-[18px] sm:h-[18px]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)] text-sm sm:text-base">Earn rewards with every purchase</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Join our loyalty program for exclusive benefits</p>
            </div>
          </div>
          <Link href="/rewards" className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-xs sm:text-sm font-medium flex items-center gap-0.5 sm:gap-1">
            Learn more <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
          </Link>
        </div>
      </div>
      
    </div>
  )
}
