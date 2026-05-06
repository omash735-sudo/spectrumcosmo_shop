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

    return () => {
      mounted = false
    }
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

  const mainNavItems: NavItem[] = [
    { type: 'link', href: '/', label: 'Home', icon: Home },
    { type: 'action', label: 'Cart', icon: ShoppingCart, onClick: openCart },
    { type: 'link', href: '/orders', label: 'Order history', icon: Clock },
    { type: 'link', href: '/my-reviews', label: 'My reviews', icon: Star },
    { type: 'link', href: '/space', label: 'SPACE', icon: ChevronRight },
    { type: 'link', href: '/contact', label: 'Help centre', icon: HelpCircle },
    { type: 'link', href: '/account/settings', label: 'Settings', icon: Settings },
  ]

  const isLoggedIn = !!user

  // Get user initial for avatar bubble
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || ''

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">

        {/* ================= DESKTOP ================= */}
        <div className="hidden md:block max-w-7xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src={logoSrc} className="h-8" />
              <span className="text-xl font-semibold">
                Spectrum<span className="text-[#F97316]">Cosmo</span>
              </span>
            </div>

            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              {!isLoggedIn ? 'Not Signed In' : `Welcome, ${user.name || user.email}`}
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="font-medium">Currency convert</span>
            <CurrencySelector />
          </div>

          <form onSubmit={handleSearch} className="mb-4 relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </form>

          <nav className="flex flex-col gap-1">
            {mainNavItems.map(item => {
              const Icon = item.icon

              if (item.type === 'action') {
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg"
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
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg',
                    isActive(item.href) && 'bg-[#F97316]/10 text-[#F97316]'
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* ================= MOBILE TOP BAR ================= */}
        <div className="md:hidden flex items-center justify-between px-5 py-3">
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <img src={logoSrc} className="h-8" />
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

      {/* ================= FIXED MOBILE MENU (PORTAL) ================= */}
      {mobileMenuOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/50 md:hidden">
            <div className="absolute left-0 top-0 w-[85%] max-w-sm h-full bg-white p-5 overflow-y-auto shadow-xl">
              {/* Header */}
              <div className="flex justify-between items-center border-b pb-3">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X />
                </button>
              </div>

              {/* User bubble (when logged in) OR sign in link (when not logged in) */}
              <div className="mt-4">
                {isLoggedIn ? (
                  <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1 pr-4">
                    <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white font-semibold text-lg">
                      {userInitial || <User size={20} />}
                    </div>
                    <span className="font-medium text-gray-800">
                      {user?.name || user?.email}
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center bg-[#F97316] text-white py-2 rounded-full font-medium"
                  >
                    Sign in
                  </Link>
                )}
              </div>

              {/* Search form (matches requirement: "not signed in, search") */}
              <form onSubmit={handleSearch} className="mt-4 relative">
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>

              {/* Navigation items */}
              <div className="mt-4 flex flex-col gap-2">
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

              {/* Log out button (only when logged in) */}
              {isLoggedIn && (
                <div className="mt-4 border-t pt-3">
                  <button onClick={logout} className="text-red-600 flex items-center gap-2">
                    <LogOut size={18} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
                }
