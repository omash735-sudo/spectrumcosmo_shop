'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  DollarSign,
  Truck,
  Heart,
  User,
  MapPin,
  CreditCard,
  Settings,
  HelpCircle,
  Package,
  ChevronRight,
} from 'lucide-react'

interface OverviewProps {
  onViewAllOrders: () => void
}

const Overview: React.FC<OverviewProps> = ({ onViewAllOrders }) => {
  const stats = [
    { label: 'Total Orders', value: '12', icon: ShoppingBag, change: '+3' },
    { label: 'Total Spent', value: '$1,284', icon: DollarSign, change: '+$189' },
    { label: 'Active Tracking', value: '1', icon: Truck, change: '-' },
    { label: 'Wishlist', value: '3', icon: Heart, change: 'new' },
  ]

  const quickLinks = [
    { name: 'Orders', href: '/account/orders', icon: ShoppingBag },
    { name: 'Wishlist', href: '/account/wishlist', icon: Heart },
    { name: 'Addresses', href: '/account/addresses', icon: MapPin },
    { name: 'Payments', href: '/account/payments', icon: CreditCard },
    { name: 'Profile', href: '/account/profile', icon: User },
    { name: 'Settings', href: '/account/settings', icon: Settings },
    { name: 'Support', href: '/account/support', icon: HelpCircle },
    { name: 'Tracking', href: '/account/tracking', icon: Package },
  ]

  const recentOrders = [
    { id: '#OR-1234', date: 'May 2, 2025', total: 189.99, status: 'Delivered' },
    { id: '#OR-1235', date: 'Apr 25, 2025', total: 59.99, status: 'Shipped' },
    { id: '#OR-1236', date: 'Apr 18, 2025', total: 249.99, status: 'Processing' },
  ]

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Delivered: 'bg-green-100 text-green-700',
      Shipped: 'bg-blue-100 text-blue-700',
      Processing: 'bg-yellow-100 text-yellow-700',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status]}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-sm p-5 flex justify-between items-center"
          >
            <div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-green-600 mt-1">{stat.change}</p>
            </div>

            <div className="bg-indigo-50 p-3 rounded-full">
              <stat.icon size={24} className="text-indigo-600" />
            </div>
          </div>
        ))}
      </div>

      {/* QUICK LINKS */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Quick Access</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition"
            >
              <link.icon size={18} className="text-indigo-600" />
              <span className="text-sm font-medium">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* RECENT ORDERS */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Recent Orders</h3>

          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium">{order.id}</p>
                  <p className="text-sm text-gray-500">{order.date}</p>
                </div>

                <div className="text-right">
                  <p className="font-bold">${order.total}</p>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onViewAllOrders}
            className="mt-4 text-indigo-600 text-sm flex items-center gap-1"
          >
            View all orders <ChevronRight size={14} />
          </button>
        </div>

        {/* TRENDING */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Trending for You</h3>

          <div className="space-y-3">
            {[
              'Smart Watch Pro',
              'Noise Cancelling Earbuds',
              'Slim Laptop Stand',
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span>{item}</span>
                <span className="text-yellow-500">★★★★☆</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview
