'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingCart, Truck, Settings } from 'lucide-react'
import { useCart } from '@/components/storefront/CartProvider'

export default function BottomNav() {
  const pathname = usePathname()
  const { totalItems } = useCart()

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart' },
    { href: '/account/tracking', icon: Truck, label: 'Track' },
    { href: '/account/settings', icon: Settings, label: 'Settings' }
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm">
      <div className="flex justify-around items-center py-2">

        {navItems.map(item => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center text-xs relative"
            >
              <item.icon
                size={20}
                className={isActive ? 'text-[#F97316]' : 'text-gray-500'}
              />

              {/* CART BADGE */}
              {item.label === 'Cart' && totalItems > 0 && (
                <span className="absolute -top-1 right-2 bg-[#F97316] text-white text-[10px] px-1.5 rounded-full">
                  {totalItems}
                </span>
              )}

              <span className={isActive ? 'text-[#F97316]' : 'text-gray-500'}>
                {item.label}
              </span>
            </Link>
          )
        })}

      </div>
    </div>
  )
}
