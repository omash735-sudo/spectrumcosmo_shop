'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingBag, ShoppingCart, User } from 'lucide-react'
import { clsx } from 'clsx'

import CurrencySelector from '@/components/storefront/CurrencySelector'
import { useCart } from '@/components/storefront/CartProvider'
import CartDrawer from '@/components/storefront/CartDrawer'

const links = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/contact', label: 'Contact' },
  { href: '/about', label: 'About Us' }
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userMenu, setUserMenu] = useState(false)

  const { totalItems } = useCart()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => setUser(data?.user || null))
      .catch(() => null)
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.href = '/'
  }

  return (
    <>
      <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#F97316] rounded-lg flex items-center justify-center">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold">
              Spectrum<span className="text-[#F97316]">Cosmo</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <nav className="flex items-center gap-6 text-sm">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-600 hover:text-[#F97316]"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">

            <CurrencySelector />

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-gray-700 hover:text-[#F97316]"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#F97316] text-white text-[10px] px-1.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#F97316] font-bold"
                >
                  {user.name?.charAt(0).toUpperCase()}
                </button>
              ) : (
                <Link href="/login">
                  <User className="w-5 h-5 text-gray-700 hover:text-[#F97316]" />
                </Link>
              )}

              {user && userMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg text-sm">
                  <Link href="/account" className="block px-4 py-2 hover:bg-orange-50">
                    My Account
                  </Link>
                  <Link href="/account/tracking" className="block px-4 py-2 hover:bg-orange-50">
                    Track Orders
                  </Link>
                  <Link href="/account/settings" className="block px-4 py-2 hover:bg-orange-50">
                    Settings
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-orange-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* WhatsApp */}
      <a
        href="https://wa.me/265893160202"
        target="_blank"
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:scale-110 transition">
          <span className="absolute inset-0 rounded-full bg-green-400 opacity-40 animate-ping"></span>
          <svg className="w-7 h-7 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.52 3.48A11.78 11.78 0 0012.06 0C5.49 0 .2 5.29.2 11.86c0 2.09.55 4.14 1.59 5.94L0 24l6.41-1.68a11.86 11.86 0 005.65 1.44h.01c6.57 0 11.86-5.29 11.86-11.86a11.78 11.78 0 00-3.41-8.42z" />
          </svg>
        </div>
      </a>
    </>
  )
}
