'use client'

import { useEffect, useState, useRef, FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Menu, X, ShoppingCart, User, Home, Package, Star, 
  Mail, Info, LogOut, Settings, ChevronDown, Search, HelpCircle, PhoneCall
} from 'lucide-react'
import clsx from 'clsx'

import CurrencySelector from '@/components/storefront/CurrencySelector'
import { useCart } from '@/components/storefront/CartProvider'
import CartDrawer from '@/components/storefront/CartDrawer'
import { useSettings } from '@/components/storefront/SettingsProvider'

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/contact', label: 'Contact', icon: Mail },
  { href: '/about', label: 'About Us', icon: Info }
]

export default function StoreSidebar({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const userMenuRef = useRef<HTMLDivElement>(null)
  const { totalItems } = useCart()
  const { settings } = useSettings()
  const pathname = usePathname()
  const router = useRouter()

  const logoSrc = settings.darkMode
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => setUser(data?.user || null))
      .catch(() => null)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSidebarOpen(false)
    }
  }

  const handleNavClick = () => {
    setSidebarOpen(false)
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">

      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-5 dark:border-gray-800">
        <img src={logoSrc} alt="Logo" className="h-8" />
        <span className="text-lg font-semibold text-gray-800 dark:text-white">
          Spectrum<span className="text-[#F97316]">Cosmo</span>
        </span>
      </div>

      {/* Search */}
      <div className="px-3 pt-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm dark:bg-gray-800 dark:text-white"
          />
        </form>
      </div>

      {/* Links */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleNavClick}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
                isActive
                  ? 'bg-orange-50 text-[#F97316]'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-4 dark:border-gray-800">

        <CurrencySelector />

        {/* User */}
        <div className="mt-4" ref={userMenuRef}>
          {user ? (
            <>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex w-full items-center justify-between"
              >
                <span>{user.name}</span>
                <ChevronDown />
              </button>

              {userMenuOpen && (
                <div className="mt-2 rounded bg-white shadow dark:bg-gray-800">
                  <Link href="/account" className="block px-4 py-2">Account</Link>
                  <Link href="/account/settings" className="block px-4 py-2">Settings</Link>
                  <button onClick={logout} className="block px-4 py-2 text-red-500">
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/signup">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex">
        <aside className="w-72 border-r dark:bg-gray-900">
          <SidebarContent />
        </aside>
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between p-4 border-b dark:bg-gray-900">

          <button onClick={() => setSidebarOpen(true)}>
            <Menu />
          </button>

          <Link href="/">SpectrumCosmo</Link>

          <div className="flex items-center gap-3">

            {/* User icon restored */}
            {user ? (
              <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                {user.name?.charAt(0)}
              </div>
            ) : (
              <Link href="/login">
                <User />
              </Link>
            )}

            <button onClick={() => setCartOpen(true)}>
              <ShoppingCart />
            </button>
          </div>
        </header>

        <main>{children}</main>

        {/* Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 w-72 h-full bg-white dark:bg-gray-900">
              <SidebarContent />
            </div>
          </div>
        )}
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
        }
