'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Menu,
  X,
  ShoppingCart,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Star,
  Home,
  Clock,
  Package,
  Info,
} from 'lucide-react'
import clsx from 'clsx'

import CurrencySelector from '@/components/storefront/CurrencySelector'
import { useCart } from '@/components/storefront/CartProvider'
import CartDrawer from '@/components/storefront/CartDrawer'
import { useSettings } from '@/components/storefront/SettingsProvider'

// Desktop navigation – same for all users
const desktopLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Help Centre' },
]

// WhatsApp config
const WHATSAPP_NUMBER = '265893160202'
const WHATSAPP_MESSAGE = 'Hi, I’m interested in purchasing products from SpectrumCosmo. Kindly assist me with catalog and ordering details.'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

const HIDE_WHATSAPP_PATHS = [
  '/checkout', '/login', '/register', '/admin', '/dashboard',
  '/account/payments', '/account/settings', '/account/profile',
]

// Links that should redirect to login if accessed directly (guest modal removed)
const PROTECTED_LINKS = [
  '/account/profile',
  '/account/settings',
  '/account/payments',
  '/my-reviews',
  '/account/wishlist',
  '/account/tracking',
  '/account/addresses',
  '/account/support',
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { totalItems } = useCart()
  const { settings } = useSettings()
  const pathname = usePathname()
  const router = useRouter()

  const showWhatsApp = !HIDE_WHATSAPP_PATHS.some(path => pathname?.startsWith(path))

  const logoSrc = settings?.darkMode
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data?.user) setUser(data.user)
        }
      } catch (err) {
        console.error('Failed to load user:', err)
      } finally {
        setLoadingUser(false)
      }
    }
    fetchUser()
  }, [])

  // Close user menu
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

  const openCart = () => {
    setCartOpen(true)
    setMobileMenuOpen(false)
  }

  const isLoggedIn = !!user
  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const profileImage = user?.profileImage

  // For direct access to protected pages, redirect to login
  const handleProtectedClick = (e: React.MouseEvent, href: string) => {
    if (!isLoggedIn && PROTECTED_LINKS.includes(href)) {
      e.preventDefault()
      router.push('/login')
    }
  }

  // Mobile drawer items: only show account‑specific links when logged in
  const alwaysItems = [
    { type: 'link' as const, href: '/', label: 'Home', icon: Home },
    { type: 'link' as const, href: '/products', label: 'Products', icon: Package },
    { type: 'link' as const, href: '/reviews', label: 'Reviews', icon: Star },
    { type: 'link' as const, href: '/about', label: 'About Us', icon: Info },
    { type: 'link' as const, href: '/contact', label: 'Help Centre', icon: HelpCircle },
    { type: 'action' as const, label: 'Cart', icon: ShoppingCart, onClick: openCart },
  ]

  const loggedInOnlyItems = [
    { type: 'link' as const, href: '/my-reviews', label: 'My Reviews', icon: Star },
    { type: 'link' as const, href: '/account/payments', label: 'Order History', icon: Clock },
    { type: 'link' as const, href: '/account/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5); } 80% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); } 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); } }
        .whatsapp-float { animation: float 2s ease-in-out infinite; }
        .whatsapp-pulse { animation: pulse-ring 1.5s infinite; }
      `}</style>

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        {/* DESKTOP */}
        <div className="hidden md:flex max-w-7xl mx-auto px-5 py-4 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoSrc} alt="Logo" className="h-10" />
            <span className="text-lg font-semibold text-gray-800">Spectrum<span className="text-[#F97316]">Cosmo</span></span>
          </Link>

          <nav className="flex items-center gap-8 text-sm">
            {desktopLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'text-gray-600 hover:text-[#F97316] transition',
                  pathname === link.href && 'text-[#F97316] font-semibold'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

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

            <div className="flex items-center gap-3">
              {!isLoggedIn ? (
                <Link href="/login" className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#F97316]">
                  <User size={16} />
                  <span>Sign in</span>
                </Link>
              ) : (
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#F97316]">
                    {profileImage ? (
                      <Image src={profileImage} alt={displayName} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
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

        {/* MOBILE TOP BAR */}
        <div className="md:hidden flex items-center justify-between px-5 py-3">
          <button onClick={() => setMobileMenuOpen(true)}><Menu size={24} /></button>
          <Link href="/" className="flex items-center gap-2">
            <img src={logoSrc} alt="Logo" className="h-8" />
            <span className="text-lg font-semibold text-gray-800">Spectrum<span className="text-[#F97316]">Cosmo</span></span>
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

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/50 md:hidden">
          <div className="absolute left-0 top-0 w-[85%] max-w-sm h-full bg-white p-5 overflow-y-auto shadow-xl flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}><X size={22} /></button>
            </div>

            {/* User info area – guests see "Guest / Visitor" with a Sign in button */}
            <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-2 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                {profileImage ? (
                  <Image src={profileImage} alt={displayName} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <User size={16} />
                )}
                {!isLoggedIn ? 'Guest / Visitor' : displayName}
              </div>
              {isLoggedIn ? (
                <Link href="/account/profile" onClick={() => setMobileMenuOpen(false)} className="text-[#F97316] text-xs">Profile</Link>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-[#F97316] text-xs">Sign in / Register</Link>
              )}
            </div>

            {/* Currency selector */}
            <div className="mt-3 py-2 border-t border-b border-gray-100">
              <CurrencySelector />
            </div>

            {/* Call to action – View Products */}
            <div className="my-3 bg-orange-50 p-2 rounded flex justify-between">
              <span className="font-semibold">View Products</span>
              <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="text-[#F97316]">view →</Link>
            </div>

            {/* Main navigation – visible to everyone */}
            <div className="flex flex-col gap-2 mt-2 flex-grow">
              {alwaysItems.map(item => {
                const Icon = item.icon
                if (item.type === 'action') {
                  return (
                    <button key={item.label} onClick={() => { item.onClick(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-2 py-2">
                      <Icon size={18} /> {item.label}
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
                    <Icon size={18} /> {item.label}
                  </Link>
                )
              })}
              {/* Account-specific links – only when logged in */}
              {isLoggedIn && loggedInOnlyItems.map(item => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-2 py-2"
                  >
                    <Icon size={18} /> {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Bottom area – logout (if logged in) or no extra items */}
            <div className="mt-6 pt-3 border-t border-gray-200">
              {isLoggedIn ? (
                <button onClick={logout} className="text-red-600 flex items-center gap-2 px-2 py-2 w-full text-left">
                  <LogOut size={18} /> Log out
                </button>
              ) : (
                <div className="text-xs text-gray-400 text-center py-2">
                  <Link href="/signup" className="text-[#F97316]">Create an account</Link> to enjoy order history and more.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Floating WhatsApp Button */}
      {showWhatsApp && (
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-[9999] whatsapp-float"
          aria-label="Chat on WhatsApp"
        >
          <div className="relative">
            <div className="whatsapp-pulse absolute inset-0 rounded-full"></div>
            <div className="bg-green-500 rounded-full p-3 shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M12.032 2.5C6.49 2.5 2 6.99 2 12.532c0 2.12.65 4.09 1.76 5.73L2 21.5l3.42-.98c1.57.93 3.4 1.48 5.36 1.48 5.54 0 10.03-4.49 10.03-10.03S17.57 2.5 12.032 2.5zm0 18.48c-1.75 0-3.38-.5-4.78-1.38l-.34-.2-2.03.58.58-2.02-.22-.35a7.86 7.86 0 0 1-1.4-4.44c0-4.33 3.53-7.85 7.85-7.85 4.33 0 7.85 3.52 7.85 7.85-.01 4.32-3.53 7.85-7.86 7.85zm4.21-5.88c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.52.12-.15.24-.59.76-.72.92-.13.15-.27.17-.5.05-.23-.12-.97-.36-1.85-1.14-.68-.6-1.14-1.34-1.28-1.57-.13-.23-.01-.36.1-.48.1-.1.23-.26.34-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.52-1.26-.72-1.73-.18-.45-.37-.37-.52-.38-.13-.01-.29-.01-.44-.01s-.4.06-.61.29c-.21.23-.8.78-.8 1.9s.82 2.2.93 2.36c.11.15 1.6 2.44 3.88 3.42.54.23.96.37 1.29.47.54.17 1.03.14 1.42.09.43-.05 1.38-.56 1.57-1.11.19-.54.19-1 .13-1.1-.06-.1-.22-.16-.46-.28z" />
              </svg>
            </div>
          </div>
        </a>
      )}
    </>
  )
}
