'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ShoppingCart, User } from 'lucide-react'
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

// Dark mode hook (kept as-is)
function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkClass = document.documentElement.classList.contains('dark')
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(isDarkClass || isSystemDark)
    }

    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
    }
  }, [])

  return isDark
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userMenu, setUserMenu] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  const { totalItems } = useCart()
  const pathname = usePathname()
  const router = useRouter()
  const isDarkMode = useDarkMode()

  const logoSrc = isDarkMode
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"

  // Fetch user
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => setUser(data?.user || null))
      .catch(() => null)
  }, [])

  // Click outside dropdown
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
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-4">

          {/* LOGO */}
          <Link href="/" onClick={() => setOpen(false)}>
            <img
              src={logoSrc}
              alt="Spectrum Cosmo Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* DESKTOP LINKS */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'transition',
                  'text-gray-600 hover:text-[#F97316] dark:text-gray-300 dark:hover:text-[#F97316]',
                  pathname === l.href && 'text-[#F97316] font-semibold'
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">

            {/* Currency */}
            <div className="hidden md:block">
              <CurrencySelector />
            </div>

            {/* Auth */}
            {!user && (
              <div className="hidden md:flex items-center gap-4 text-sm">
                <Link href="/login" className="hover:text-[#F97316] transition">
                  Login
                </Link>
                <Link href="/signup" className="hover:text-[#F97316] transition">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-gray-700 hover:text-[#F97316] transition hover:scale-110 dark:text-gray-300"
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
                  <User className="w-5 h-5 text-gray-700 hover:text-[#F97316] dark:text-gray-300" />
                </Link>
              )}

              {user && userMenu && (
                <div className="absolute right-0 mt-3 w-52 bg-white border rounded-md shadow-lg text-sm dark:bg-gray-800 dark:border-gray-700">
                  <Link href="/account" className="block px-4 py-2 hover:bg-orange-50 dark:hover:bg-gray-700">
                    My Account
                  </Link>
                  <Link href="/account/tracking" className="block px-4 py-2 hover:bg-orange-50 dark:hover:bg-gray-700">
                    Track Orders
                  </Link>
                  <Link href="/account/settings" className="block px-4 py-2 hover:bg-orange-50 dark:hover:bg-gray-700">
                    Settings
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-orange-50 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-gray-700 dark:text-gray-300"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>

          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={clsx(
        'md:hidden border-t bg-white dark:bg-gray-900 dark:border-gray-800',
        'transition-all duration-300 ease-in-out',
        open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      )}>
        <nav className="px-5 py-4 space-y-2">

          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={clsx(
                'block px-3 py-2 text-sm rounded-md transition',
                'text-gray-700 dark:text-gray-300',
                pathname === l.href && 'bg-orange-50 dark:bg-gray-800 font-semibold'
              )}
            >
              {l.label}
            </Link>
          ))}

          <div className="px-3 py-2">
            <CurrencySelector />
          </div>

          <div className="border-t mt-3 pt-3 dark:border-gray-800">
            {user ? (
              <>
                <Link href="/account" className="block px-3 py-2 text-sm">My Account</Link>
                <button onClick={logout} className="w-full text-left px-3 py-2 text-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 text-sm">Login</Link>
                <Link href="/signup" className="block px-3 py-2 text-sm">Sign Up</Link>
              </>
            )}
          </div>

          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="block w-full text-center mt-3 bg-[#F97316] text-white py-2.5 rounded-md hover:bg-[#e06510] transition"
          >
            Shop Now
          </Link>

        </nav>
      </div>

      {/* CART */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* WHATSAPP */}
      <a
        href="https://wa.me/265893160202?text=Hi%20I%20want%20to%20order%20from%20SpectrumCosmo"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:scale-110 transition">
          <span className="absolute inset-0 rounded-full bg-green-400 opacity-40 animate-ping"></span>
          <svg className="w-7 h-7 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.52 3.48A11.78 11.78 0 0012.06 0C5.49 0 .2 5.29.2 11.86c0 2.09.55 4.14 1.59 5.94L0 24l6.41-1.68a11.86 11.86 0 005.65 1.44h.01c6.57 0 11.86-5.29 11.86-11.86a11.78 11.78 0 00-3.41-8.42z" />
          </svg>
        </div>
      </a>
    </>
  )
    }
