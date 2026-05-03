'use client'

import { ReactNode } from 'react'
import Navbar from '@/components/storefront/Navbar'
import {
  LayoutDashboard,
  Package,
  CreditCard,
  MapPin,
  Truck,
  Settings,
  Heart,
  User,
  HelpCircle,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Overview', href: '/account', icon: LayoutDashboard },
    { name: 'Orders', href: '/account/orders', icon: Package },
    { name: 'Wishlist', href: '/account/wishlist', icon: Heart },
    { name: 'Profile', href: '/account/profile', icon: User },
    { name: 'Payments', href: '/account/payments', icon: CreditCard },
    { name: 'Addresses', href: '/account/addresses', icon: MapPin },
    { name: 'Tracking', href: '/account/tracking', icon: Truck },
    { name: 'Support', href: '/account/support', icon: HelpCircle },
    { name: 'Settings', href: '/account/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* TOP BAR (optional but clean for branding) */}
      <Navbar />

      <div className="flex">

        {/* SIDEBAR */}
        <aside className="hidden md:flex w-64 bg-white border-r flex-col min-h-screen sticky top-0">

          <div className="p-6 border-b">
            <h2 className="font-bold text-lg text-gray-900">
              My Account
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Manage everything in one place
            </p>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/account' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition
                    ${
                      active
                        ? 'bg-orange-50 text-orange-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>

      </div>
    </div>
  )
}
