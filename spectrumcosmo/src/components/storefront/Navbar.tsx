'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ShoppingCart, User } from 'lucide-react'
import clsx from 'clsx'

import CurrencySelector from '@/components/storefront/CurrencySelector'
import { useCart } from '@/components/storefront/CartProvider'
import CartDrawer from '@/components/storefront/CartDrawer'
import { useSettings } from '@/components/storefront/SettingsProvider'

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

  const menuRef = useRef<HTMLDivElement>(null)

  const { totalItems } = useCart()
  const { settings } = useSettings()
  const pathname = usePathname()
  const router = useRouter()

  const logoSrc = settings.darkMode
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"

  // Fetch user
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => setUser(data?.user || null))
      .catch(() => null)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenu(false)
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

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-4">

          {/* Logo + Name */}
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <img src={logoSrc} alt="Spectrum Cosmo Logo" className="h-10 w-auto object-contain" />
            <span className="text-lg font-semibold tracking-tight text-gray-800 dark:text-white">
              Spectrum<span className="text-[#F97316]">Cosmo</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'transition text-gray-600 hover:text-[#F97316] dark:text-gray-300 dark:hover:text-[#F97316]',
                  pathname === l.href && 'text-[#F97316] font-semibold'
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">

            <div className="hidden md:block">
              <CurrencySelector />
            </div>

            {!user && (
              <div className="hidden md:flex gap-4 text-sm">
                <Link href="/login">Login</Link>
                <Link href="/signup">Sign Up</Link>
              </div>
            )}

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative hover:scale-110 transition"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#F97316] text-white text-[10px] px-1.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User */}
            <div className="relative" ref={menuRef}>
              {user ? (
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-[#F97316] font-bold dark:bg-orange-900 dark:text-orange-200"
                >
                  {user.name?.charAt(0).toUpperCase()}
                </button>
              ) : (
                <Link href="/login">
                  <User className="w-5 h-5" />
                </Link>
              )}

              {user && userMenu && (
                <div className="absolute right-0 mt-3 w-52 bg-white border rounded-md shadow-lg text-sm dark:bg-gray-800 dark:border-gray-700">
                  <Link href="/account" className="block px-4 py-2">My Account</Link>
                  <Link href="/account/settings" className="block px-4 py-2">Settings</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-2">
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setOpen(!open)} className="md:hidden">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>

          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={clsx(
        'md:hidden transition-all duration-300',
        open ? 'max-h-[500px]' : 'max-h-0 overflow-hidden'
      )}>
        <nav className="px-5 py-4 space-y-2">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
            }
