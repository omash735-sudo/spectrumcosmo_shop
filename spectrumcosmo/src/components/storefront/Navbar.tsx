'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingBag, ShoppingCart } from 'lucide-react'
import { clsx } from 'clsx'

import CurrencySelector from '@/components/storefront/CurrencySelector'
import { useCart } from '@/components/storefront/CartProvider'
import CartDrawer from '@/components/storefront/CartDrawer'

const links = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/contact', label: 'Contact' },
  { href: '/about', label: 'About Us' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  const { totalItems } = useCart()

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user || null))
      .catch(() => null)
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.href = '/'
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between h-16">

            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center">
                <ShoppingBag size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-[#111111]">
                Spectrum<span className="text-[#F97316]">Cosmo</span>
              </span>
            </Link>

            {/* DESKTOP LINKS */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#F97316] rounded-lg hover:bg-orange-50"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* RIGHT SIDE (DESKTOP) */}
            <div className="hidden md:flex items-center gap-3">

              <CurrencySelector />

              {/* CART */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-lg hover:bg-orange-50"
              >
                <ShoppingCart size={18} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#F97316] text-white text-[10px] grid place-items-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* USER (DESKTOP) */}
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="text-sm text-gray-600 hover:text-[#F97316]"
                  >
                    {user.name?.split(' ')[0] || 'Account'}
                  </Link>

                  <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-[#F97316]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-[#F97316]"
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/signup"
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              <Link href="/products" className="btn-primary text-sm">
                Shop Now
              </Link>
            </div>

            {/* MOBILE BUTTON */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>

          </div>
        </div>

        {/* MOBILE MENU */}
        <div
          className={clsx(
            'md:hidden border-t bg-white overflow-hidden transition-all',
            open ? 'max-h-[600px]' : 'max-h-0'
          )}
        >
          <nav className="px-4 py-3 space-y-2">

            {/* LINKS */}
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 rounded-lg"
              >
                {l.label}
              </Link>
            ))}

            {/* CURRENCY */}
            <div className="px-4 py-2">
              <CurrencySelector />
            </div>

            {/* CART */}
            <button
              onClick={() => {
                setCartOpen(true)
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700"
            >
              Cart ({totalItems})
            </button>

            {/* USER (MOBILE FIXED) */}
            <div className="border-t pt-2 mt-2">

              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700"
                  >
                    My Account
                  </Link>

                  <button
                    onClick={() => {
                      logout()
                      setOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700"
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* SHOP BUTTON */}
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="btn-primary w-full text-center mt-2"
            >
              Shop Now
            </Link>

          </nav>
        </div>
      </header>

      {/* CART DRAWER */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
