'use client'

import { useEffect, useState, useRef, FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Menu,
  X,
  ShoppingCart,
  User,
  Home,
  Package,
  Star,
  Mail,
  Info,
  LogOut,
  ChevronDown,
  Search,
} from 'lucide-react'
import clsx from 'clsx'

import CurrencySelector from '@/components/storefront/CurrencySelector'
import { useCart } from '@/components/storefront/CartProvider'
import CartDrawer from '@/components/storefront/CartDrawer'

/* ---------------- LINKS ---------------- */
const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/contact', label: 'Contact', icon: Mail },
  { href: '/about', label: 'About Us', icon: Info },
]

/* ---------------- ACTIVE LINK ---------------- */
const isActiveLink = (pathname: string, href: string) => {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

/* ---------------- USER DROPDOWN (CLEANED) ---------------- */
const UserDropdown = ({ user }: { user: any }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 text-gray-700 hover:text-orange-500"
      >
        <User size={18} />
        Login
      </Link>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 focus:outline-none"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-700">
          {user.name?.charAt(0) || user.email?.charAt(0)}
        </div>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg z-20"
          role="menu"
        >
          <Link
            href="/account"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            Account
          </Link>
          <Link
            href="/account/settings"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 flex items-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------- MAIN LAYOUT ---------------- */
export default function UnifiedLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState('')

  const { totalItems } = useCart()
  const pathname = usePathname()
  const router = useRouter()

  const logo =
    'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png'

  /* ---------------- USER FETCH ---------------- */
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null))
  }, [])

  /* ---------------- LOCK SCROLL ---------------- */
  useEffect(() => {
    if (!mobileOpen) return

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }

    window.addEventListener('keydown', esc)

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', esc)
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  /* ---------------- SEARCH ---------------- */
  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return
    router.push(`/products?search=${encodeURIComponent(search)}`)
    setSearch('')
    setMobileOpen(false)
  }

  /* ---------------- NAV ITEM ---------------- */
  const NavItem = ({
    link,
    onClick,
  }: {
    link: (typeof links)[0]
    onClick?: () => void
  }) => {
    const Icon = link.icon
    const active = isActiveLink(pathname, link.href)

    return (
      <Link
        href={link.href}
        onClick={onClick}
        className={clsx(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
          active ? 'bg-orange-50 text-orange-500' : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <Icon size={18} />
        {link.label}
      </Link>
    )
  }

  /* ---------------- SIDEBAR ---------------- */
  const Sidebar = () => (
    <aside className="w-72 border-r bg-white flex flex-col h-full sticky top-0">
      <div className="flex items-center gap-2 border-b px-4 py-5">
        <Image src={logo} alt="logo" width={32} height={32} className="h-8 w-auto" />
        <span className="font-semibold">
          Spectrum<span className="text-orange-500">Cosmo</span>
        </span>
      </div>

      <div className="p-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full border rounded-lg pl-9 py-2 text-sm"
          />
        </form>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map(l => (
          <NavItem key={l.href} link={l} />
        ))}
      </nav>

      <div className="border-t p-4 space-y-4">
        <CurrencySelector />

        <button
          onClick={() => setCartOpen(true)}
          className="flex items-center gap-2 relative"
          aria-label={`Shopping cart, ${totalItems} items`}
        >
          <ShoppingCart size={18} />
          Cart
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-4 bg-orange-500 text-white text-xs rounded-full px-1.5">
              {totalItems}
            </span>
          )}
        </button>

        <UserDropdown user={user} />
      </div>
    </aside>
  )

  /* ---------------- MOBILE ---------------- */
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:flex w-full">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>

      <div className="lg:hidden w-full">
        <header className="flex items-center justify-between border-b p-4 bg-white">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu />
          </button>

          <Image src={logo} alt="logo" width={28} height={28} />

          <button
            onClick={() => setCartOpen(true)}
            className="relative"
            aria-label={`Shopping cart, ${totalItems} items`}
          >
            <ShoppingCart />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full px-1.5">
                {totalItems}
              </span>
            )}
          </button>
        </header>

        <main className="p-4">{children}</main>

        {mobileOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />

            <div className="absolute left-0 top-0 w-80 h-full bg-white flex flex-col">
              <div className="flex justify-end p-4">
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X />
                </button>
              </div>

              {/* Mobile search */}
              <div className="px-4 pb-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full border rounded-lg pl-9 py-2 text-sm"
                  />
                </form>
              </div>

              <nav className="flex-1 px-4 space-y-2">
                {links.map(l => (
                  <NavItem
                    key={l.href}
                    link={l}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </nav>

              {/* Mobile currency selector */}
              <div className="p-4 border-t">
                <CurrencySelector />
              </div>
            </div>
          </div>
        )}
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
  }
