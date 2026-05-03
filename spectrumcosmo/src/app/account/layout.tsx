'use client'

import Link from 'next/link'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r p-5 space-y-3">
        <h2 className="text-xl font-bold mb-6">My Account</h2>

        <nav className="space-y-2 text-sm">
          <Link href="/account" className="block hover:text-orange-500">
            Overview
          </Link>

          <Link href="/account/orders" className="block hover:text-orange-500">
            Orders
          </Link>

          <Link href="/account/wishlist" className="block hover:text-orange-500">
            Wishlist
          </Link>

          <Link href="/account/addresses" className="block hover:text-orange-500">
            Addresses
          </Link>

          <Link href="/account/tracking" className="block hover:text-orange-500">
            Tracking
          </Link>

          <Link href="/account/settings" className="block hover:text-orange-500">
            Settings
          </Link>
        </nav>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
