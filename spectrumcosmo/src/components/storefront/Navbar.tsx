'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  X,
  ShoppingCart,
  User,
  LogOut
} from 'lucide-react'
import clsx from 'clsx'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  const { totalItems } = useCart()
  const pathname = usePathname()
  const router = useRouter()

  const logoSrc =
    'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png'

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => setUser(data?.user || null))
      .catch(() => {})
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }, [router])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const isLoggedIn = !!user

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        
        {/* ================= DESKTOP ================= */}
        <div className="hidden md:flex max-w-7xl mx-auto items-center justify-between px-5 py-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src={logoSrc} alt="Logo" className="h-10" />
            <span className="text-lg font-semibold">
              Spectrum<span className="text-[#F97316]">Cosmo</span>
            </span>
          </Link>

          {/* NAV LINKS (RESTORED) */}
          <nav className="flex items-center gap-8 text-sm">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'text-gray-600 hover:text-[#F97316]',
                  isActive(l.href) && 'text-[#F97316] font-semibold'
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">

            {/* Currency */}
            <CurrencySelector />

            {/* Cart */}
            <button onClick={() => setCartOpen(true)} className="relative">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#F97316] text-white text-xs px-1 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Auth */}
            {isLoggedIn ? (
              <button onClick={logout} className="text-sm text-red-500">
                <LogOut size={18} />
              </button>
            ) : (
              <Link href="/login">
                <User size={20} />
              </Link>
            )}

          </div>
        </div>

        {/* ================= MOBILE ================= */}
        <div className="md:hidden flex items-center justify-between px-5 py-3">
          
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <img src={logoSrc} alt="Logo" className="h-8" />
          </Link>

          <button onClick={() => setCartOpen(true)} className="relative">
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#F97316] text-white text-xs px-1 rounded-full">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ================= MOBILE DRAWER ================= */}
      {mobileMenuOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/50">
            <div className="absolute left-0 top-0 w-[85%] max-w-sm h-full bg-white p-5 flex flex-col">

              {/* Header */}
              <div className="flex justify-between items-center border-b pb-3">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={22} />
                </button>
              </div>

              {/* Currency */}
              <div className="my-4">
                <CurrencySelector />
              </div>

              {/* Links */}
              <nav className="flex flex-col gap-4">
                {links.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              {/* Bottom */}
              <div className="mt-auto pt-6 border-t">
                {isLoggedIn ? (
                  <button onClick={logout} className="text-red-500 flex items-center gap-2">
                    <LogOut size={18} /> Log out
                  </button>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <User size={18} /> Sign in
                  </Link>
                )}
              </div>

            </div>
          </div>,
          document.body
        )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
  }
