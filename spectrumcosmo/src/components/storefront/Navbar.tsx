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
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">

        <div className="max-w-7xl mx-auto">

          {/* ================= TOP BAR ================= */}
          <div className="hidden md:flex justify-between items-center px-4 py-2 text-xs text-gray-600 border-b border-gray-100">

            {/* LEFT */}
            <div className="flex items-center gap-2">
              <span>📞</span>
              <span>Hotline 24/7 +265 88 917 8877</span>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-6">

              <button className="hover:text-[#F97316]">
                Track Order
              </button>

              <CurrencySelector />

              <button className="hover:text-[#F97316]">
                Eng ▼
              </button>

              {user ? (
                <button onClick={logout} className="hover:text-[#F97316]">
                  Logout
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="hover:text-[#F97316]">
                    Login
                  </Link>
                  <span>/</span>
                  <Link href="/signup" className="hover:text-[#F97316]">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ================= BOTTOM BAR ================= */}
          <div className="flex items-center justify-between px-4 py-4">

            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#F97316] rounded-lg flex items-center justify-center">
                <ShoppingBag size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-[#111111]">
                Spectrum<span className="text-[#F97316]">Cosmo</span>
              </span>
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-gray-600 hover:text-[#F97316] transition"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-4">

              {/* CART */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 text-gray-700 hover:text-[#F97316]"
              >
                <ShoppingCart size={18} />

                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#F97316] text-white text-[10px] px-1.5 rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* MOBILE MENU BUTTON */}
              <button
                onClick={() => setOpen(!open)}
                className="md:hidden p-2"
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>

              {/* SHOP BUTTON */}
              <Link
                href="/products"
                className="hidden md:inline-block bg-[#F97316] text-white px-4 py-2 rounded-full text-sm hover:bg-orange-600 transition"
              >
                Shop Now
              </Link>
            </div>

          </div>
        </div>
      </header>

      {/* ================= MOBILE MENU ================= */}
      <div
        className={clsx(
          'md:hidden border-t bg-white overflow-hidden transition-all',
          open ? 'max-h-[600px]' : 'max-h-0'
        )}
      >
        <nav className="px-4 py-3 space-y-2">

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

          <div className="px-4 py-2">
            <CurrencySelector />
          </div>

          <button
            onClick={() => {
              setCartOpen(true)
              setOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700"
          >
            Cart ({totalItems})
          </button>

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

          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="btn-primary w-full text-center mt-2"
          >
            Shop Now
          </Link>

        </nav>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
