'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  X,
  ShoppingCart,
  Search as SearchIcon,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Star,
  Home,
  Clock,
  ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'

import CurrencySelector from '@/components/storefront/CurrencySelector'
import { useCart } from '@/components/storefront/CartProvider'
import CartDrawer from '@/components/storefront/CartDrawer'

type NavItem =
  | { type: 'link'; href: string; label: string; icon: any }
  | { type: 'action'; label: string; icon: any; onClick: () => void }

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { totalItems } = useCart()
  const pathname = usePathname()
  const router = useRouter()

  const logoSrc =
    'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png'

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (mounted) setUser(data?.user || null)
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }, [router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    setSearchQuery('')
    setMobileMenuOpen(false)
  }

  const isActive = (href: string) => pathname.startsWith(href)

  const openCart = () => {
    setCartOpen(true)
    setMobileMenuOpen(false)
  }

  const isLoggedIn = !!user

  // Navigation items – SPACE removed, added Profile link
  const mainNavItems: NavItem[] = [
    { type: 'link', href: '/', label: 'Home', icon: Home },
    { type: 'action', label: 'Cart', icon: ShoppingCart, onClick: openCart },
    { type: 'link', href: '/orders', label: 'Order history', icon: Clock },
    { type: 'link', href: '/my-reviews', label: 'My reviews', icon: Star },
    // Profile link – goes to /account/profile
    { type: 'link', href: '/account/profile', label: 'Profile', icon: User },
    { type: 'link', href: '/contact', label: 'Help centre', icon: HelpCircle },
    { type: 'link', href: '/account/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">

        {/* ================= DESKTOP ================= */}
        <div className="hidden md:block max-w-7xl mx-auto px-5 py-4">
          {/* Row: Logo + "not Signed" badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src={logoSrc} alt="Logo" className="h-8" />
              <span className="text-xl font-semibold">
                Spectrum<span className="text-[#F97316]">Cosmo</span>
              </span>
            </div>
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              {!isLoggedIn ? 'not Signed' : `Signed: ${user?.name || user?.email}`}
            </div>
          </div>

          {/* Currency convert */}
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="font-medium">Currency convert</span>
            <CurrencySelector />
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mb-4 relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </form>

          {/* Guest / Visitor line */}
          <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg flex items-center gap-2">
            <User size={16} />
            <span>{!isLoggedIn ? 'Guest / Visitor' : `Signed in as ${user?.name || user?.email}`}</span>
            {!isLoggedIn && (
              <Link href="/login" className="ml-auto text-[#F97316] text-xs font-medium hover:underline">
                Sign in
              </Link>
            )}
          </div>

          {/* "show now – view" promo block (from sketch) */}
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-xl flex justify-between items-center">
            <span className="font-semibold text-gray-800">✨ show now</span>
            <Link href="/products" className="text-[#F97316] text-sm font-medium hover:underline flex items-center gap-1">
              view <ChevronRight size={14} />
            </Link>
          </div>

          {/* Main vertical navigation */}
          <nav className="flex flex-col gap-1">
            {mainNavItems.map((item, idx) => {
              const Icon = item.icon

              if (item.type === 'action') {
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              }

              // Add extra margin-top between "My reviews" and "Help centre"
              const extraMargin = item.label === 'Help centre' ? 'mt-3' : ''

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    extraMargin,
                    isActive(item.href)
                      ? 'bg-[#F97316]/10 text-[#F97316] font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-[#F97316]'
                  )}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Log out / Sign in at the bottom */}
          <div className="pt-3 mt-3 border-t border-gray-100">
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Log out</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <User size={18} />
                <span className="text-sm font-medium">Sign in</span>
              </Link>
            )}
          </div>
        </div>

        {/* ================= MOBILE TOP BAR ================= */}
        <div className="md:hidden flex items-center justify-between px-5 py-3">
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <img src={logoSrc} alt="Logo" className="h-8" />
            <span className="text-lg font-semibold">
              Spectrum<span className="text-[#F97316]">Cosmo</span>
            </span>
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

      {/* ================= MOBILE DRAWER (PORTAL) ================= */}
      {mobileMenuOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/50 md:hidden">
            <div className="absolute left-0 top-0 w-[85%] max-w-sm h-full bg-white p-5 overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={22} />
                </button>
              </div>

              {/* Mobile: Guest status & promo (simplified) */}
              <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {!isLoggedIn ? '🔓 Guest / Visitor' : `👋 ${user?.name || user?.email}`}
              </div>
              <div className="my-3 bg-orange-50 p-2 rounded flex justify-between">
                <span className="font-semibold">show now</span>
                <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="text-[#F97316]">
                  view →
                </Link>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                {mainNavItems.map(item => {
                  const Icon = item.icon
                  if (item.type === 'action') {
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.onClick()
                          setMobileMenuOpen(false)
                        }}
                        className="flex items-center gap-3 px-2 py-2"
                      >
                        <Icon size={18} />
                        {item.label}
                      </button>
                    )
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-2 py-2"
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>

              <div className="mt-4 border-t pt-3">
                {isLoggedIn ? (
                  <button onClick={logout} className="text-red-600 flex items-center gap-2">
                    <LogOut size={18} /> Log out
                  </button>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
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
