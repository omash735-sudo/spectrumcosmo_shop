'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
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
import { useSettings } from '@/components/storefront/SettingsProvider'

const desktopLinks = [
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
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { totalItems } = useCart()
  const { settings } = useSettings()
  const pathname = usePathname()
  const router = useRouter()

  // Logo based on dark mode setting (light/dark variant) – but navbar itself stays light
  const logoSrc = settings.darkMode
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"

  // Fetch user
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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  const openCart = () => {
    setCartOpen(true)
    setMobileMenuOpen(false)
  }

  const isLoggedIn = !!user
  const displayName = user?.name || user?.email?.split('@')[0] || 'User'

  // Mobile drawer items (same as longer code)
  const alwaysItems = [
    { type: 'link' as const, href: '/', label: 'Home', icon: Home },
    { type: 'action' as const, label: 'Cart', icon: ShoppingCart, onClick: openCart },
  ]
  const loggedInItems = [
    { type: 'link' as const, href: '/my-reviews', label: 'My reviews', icon: Star },
    { type: 'link' as const, href: '/account/payments', label: 'Order history', icon: Clock },
  ]
  const bottomItems = [
    { type: 'link' as const, href: '/contact', label: 'Help centre', icon: HelpCircle },
    { type: 'link' as const, href: '/account/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        {/* ========== DESKTOP (horizontal top bar, no dark mode classes) ========== */}
        <div className="hidden md:flex max-w-7xl mx-auto px-5 py-4 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src={logoSrc} alt="Logo" className="h-10" />
            <span className="text-lg font-semibold text-gray-800">
              Spectrum<span className="text-[#F97316]">Cosmo</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="flex items-center gap-8 text-sm">
            {desktopLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'text-gray-600 hover:text-[#F97316]',
                  pathname === link.href && 'text-[#F97316] font-semibold'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: currency, cart, auth */}
          <div className="flex items-center gap-4">
            <CurrencySelector />

            <button onClick={openCart} className="relative">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#F97316] text-white text-xs px-1 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Auth section: guest badge + sign in / user dropdown */}
            <div className="flex items-center gap-3">
              {!isLoggedIn ? (
                <>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    not Signed
                  </span>
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-[#F97316]"
                  >
                    Sign in
                  </Link>
                </>
              ) : (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#F97316]"
                  >
                    <User size={18} />
                    <span>{displayName}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                      <Link
                        href="/account/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          logout()
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== MOBILE TOP BAR ========== */}
        <div className="md:hidden flex items-center justify-between px-5 py-3">
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <img src={logoSrc} alt="Logo" className="h-8" />
            <span className="text-lg font-semibold text-gray-800">
              Spectrum<span className="text-[#F97316]">Cosmo</span>
            </span>
          </Link>
          <button onClick={openCart} className="relative">
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#F97316] text-white text-xs px-1 rounded-full">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ========== MOBILE DRAWER (full featured, light colors) ========== */}
      {mobileMenuOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/50 md:hidden">
            <div className="absolute left-0 top-0 w-[85%] max-w-sm h-full bg-white p-5 overflow-y-auto shadow-xl flex flex-col">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={22} />
                </button>
              </div>

              {/* User status */}
              <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-2 rounded flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User size={16} />
                  {!isLoggedIn ? 'Guest / Visitor' : displayName}
                </span>
                {isLoggedIn ? (
                  <Link
                    href="/account/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#F97316] text-xs"
                  >
                    Profile
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[#F97316] text-xs"
                  >
                    Sign in
                  </Link>
                )}
              </div>

              {/* Currency selector */}
              <div className="mt-3 py-2 border-t border-b border-gray-100">
                <CurrencySelector />
              </div>

              {/* "show now" promo */}
              <div className="my-3 bg-orange-50 p-2 rounded flex justify-between">
                <span className="font-semibold">show now</span>
                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#F97316]"
                >
                  view →
                </Link>
              </div>

              {/* Main nav items */}
              <div className="flex flex-col gap-2 mt-2 flex-grow">
                {alwaysItems.map(item => {
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

                {isLoggedIn && (
                  <>
                    {loggedInItems.map(item => {
                      const Icon = item.icon
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
                  </>
                )}
              </div>

              {/* Bottom items (help, settings, logout/signin) */}
              <div className="mt-6 pt-3 border-t border-gray-200">
                {bottomItems.map(item => {
                  const Icon = item.icon
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
                {isLoggedIn ? (
                  <button
                    onClick={logout}
                    className="text-red-600 flex items-center gap-2 px-2 py-2 w-full text-left"
                  >
                    <LogOut size={18} /> Log out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-2 py-2"
                  >
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
