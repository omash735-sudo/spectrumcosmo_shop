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
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">

          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#F97316] rounded-lg flex items-center justify-center">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-[#111111]">
              Spectrum<span className="text-[#F97316]">Cosmo</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
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

          <div className="flex items-center gap-4">

            <div className="hidden md:block">
              <CurrencySelector />
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative text-gray-700 hover:text-[#F97316]"
            >
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#F97316] text-white text-[10px] px-1.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative">

                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#F97316] font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {userMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg text-sm">

                    <Link
                      href="/account"
                      className="block px-4 py-2 hover:bg-orange-50"
                    >
                      My Account
                    </Link>

                    <Link
                      href="/account/tracking"
                      className="block px-4 py-2 hover:bg-orange-50"
                    >
                      Track Orders
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
            ) : (
              <div className="hidden md:flex items-center gap-2 text-sm">
                <Link href="/login" className="hover:text-[#F97316]">
                  Login
                </Link>
                <span>/</span>
                <Link href="/signup" className="hover:text-[#F97316]">
                  Sign Up
                </Link>
              </div>
            )}

            <button onClick={() => setOpen(!open)} className="md:hidden">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link
              href="/products"
              className="hidden md:inline-block bg-[#F97316] text-white px-4 py-2 rounded-full text-sm"
            >
              Shop Now
            </Link>

          </div>
        </div>
      </header>

      <div className={clsx('md:hidden border-t bg-white', open ? 'block' : 'hidden')}>
        <nav className="px-4 py-3 space-y-2">

          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700"
            >
              {l.label}
            </Link>
          ))}

          <div className="px-4 py-2">
            <CurrencySelector />
          </div>

          <Link
            href="/products"
            className="btn-primary w-full text-center mt-2"
          >
            Shop Now
          </Link>

        </nav>
      </div>

      <a
        href="https://wa.me/265893160202"
        target="_blank"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
      />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
