'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function AccountHub() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    orders: 0,
    pendingPayments: 0,
    approvedPayments: 0
  })

  const load = async () => {
    setLoading(true)

    const res = await fetch('/api/account/orders')
    const data = res.ok ? await res.json() : []

    const orders = data?.length || 0
    const pendingPayments = data?.filter((o: any) => o.status === 'pending').length || 0
    const approvedPayments = data?.filter((o: any) => o.status === 'approved').length || 0

    setStats({
      orders,
      pendingPayments,
      approvedPayments
    })

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">

        {/* HEADER */}
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-[#111111]">
            My Account
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your profile, orders, payments and settings
          </p>

          {/* STATS */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">

            <div className="bg-white border rounded-xl p-5">
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-[#111111]">
                {loading ? <Loader2 className="animate-spin" /> : stats.orders}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <p className="text-gray-500 text-sm">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600">
                {loading ? <Loader2 className="animate-spin" /> : stats.pendingPayments}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <p className="text-gray-500 text-sm">Approved Payments</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? <Loader2 className="animate-spin" /> : stats.approvedPayments}
              </p>
            </div>

          </div>

          {/* NAVIGATION GRID */}
          <div className="grid md:grid-cols-2 gap-4 mt-8">

            {/* PROFILE */}
            <Link
              href="/account/profile"
              className="bg-white border rounded-xl p-6 hover:shadow transition"
            >
              <h2 className="font-semibold text-lg">Profile</h2>
              <p className="text-sm text-gray-500 mt-1">
                Personal information & account settings
              </p>
            </Link>

            {/* ORDERS */}
            <Link
              href="/account/orders"
              className="bg-white border rounded-xl p-6 hover:shadow transition"
            >
              <h2 className="font-semibold text-lg">Orders</h2>
              <p className="text-sm text-gray-500 mt-1">
                Track delivery status and order history
              </p>
            </Link>

            {/* PAYMENTS */}
            <Link
              href="/account/payments"
              className="bg-white border rounded-xl p-6 hover:shadow transition"
            >
              <h2 className="font-semibold text-lg">Payments</h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload proof and track approval status
              </p>
            </Link>

            {/* ADDRESSES */}
            <Link
              href="/account/address"
              className="bg-white border rounded-xl p-6 hover:shadow transition"
            >
              <h2 className="font-semibold text-lg">Addresses</h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage delivery locations
              </p>
            </Link>

          </div>

          {/* QUICK INFO BANNER */}
          <div className="mt-10 bg-white border rounded-xl p-6">
            <h3 className="font-semibold text-[#111111]">
              Account Status
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              All your activity (orders, payments, and delivery tracking)
              is managed from this dashboard. Updates appear here once
              your payment is reviewed by admin.
            </p>
          </div>

        </div>

      </main>

      <Footer />
    </>
  )
}
