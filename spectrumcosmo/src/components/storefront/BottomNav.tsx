'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/components/storefront/CartProvider'

export default function BottomNav() {
  const pathname = usePathname()
  const { totalItems } = useCart()

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/products', icon: ShoppingCart, label: 'Shop' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart' },
    { href: '/account', icon: User, label: 'Profile' }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-sm">
      <div className="flex justify-around items-center py-2">

        {navItems.map(item => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center text-[10px] relative"
            >
              <div className="relative">
                <item.icon
                  size={22}
                  strokeWidth={2}
                  className={isActive ? 'text-black' : 'text-gray-400'}
                />

                {item.href === '/cart' && totalItems > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#F97316] text-white text-[9px] px-1.5 rounded-full">
                    {totalItems}
                  </span>
                )}
              </div>

              <span
                className={`mt-1 ${
                  isActive ? 'text-black font-semibold' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <div className="w-1 h-1 bg-black rounded-full mt-1"></div>
              )}
            </Link>
          )
        })}

      </div>
    </div>
  )
}
