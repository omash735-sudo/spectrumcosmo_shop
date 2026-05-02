'use client'

import { ReactNode } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import {
  LayoutDashboard, Package, CreditCard, MapPin, Truck, Settings
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Overview', href: '/account', icon: LayoutDashboard },
    { name: 'Orders', href: '/account/orders', icon: Package },
    { name: 'Payments', href: '/account/payments', icon: CreditCard },
    { name: 'Addresses', href: '/account/addresses', icon: MapPin },
    { name: 'Tracking', href: '/account/tracking', icon: Truck },
    { name: 'Settings', href: '/account/settings', icon: Settings },
  ]

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 flex">
        
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-64 bg-white border-r flex-col">
          <div className="p-6 border-b">
            <h2 className="font-bold text-lg text-[#111]">
              My Account
            </h2>
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition
                  ${active 
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

        {/* CONTENT */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </>
  )
}
