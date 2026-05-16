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
  Info,
  MapPin,
} from 'lucide-react'
import clsx from 'clsx'

import CurrencySelector from '@/components/storefront/CurrencySelector'
import { useCart } from '@/components/storefront/CartProvider'
import CartDrawer from '@/components/storefront/CartDrawer'
import { useSettings } from '@/components/storefront/SettingsProvider'
import SearchBar from '@/components/storefront/SearchBar'

const desktopLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
]

const WHATSAPP_NUMBER = '265893160202'
const WHATSAPP_MESSAGE = 'Hi, I’m interested in purchasing products from SpectrumCosmo. Kindly assist me with catalog and ordering details.'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

const HIDE_WHATSAPP_PATHS = [
  '/checkout', '/login', '/register', '/admin', '/dashboard',
  '/account/payments', '/account/settings', '/account/profile',
]

const PROTECTED_LINKS = [
  '/account/profile',
  '/account/settings',
  '/account/payments',
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
  const desktopDropdownRef = useRef<HTMLDivElement>(null)

  const { totalItems } = useCart()
  const { settings } = useSettings()
  const pathname = usePathname()
  const router = useRouter()

  const showWhatsApp = !HIDE_WHATSAPP_PATHS.some(path => pathname?.startsWith(path))

  const logoSrc = settings?.darkMode
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(target)) {
        setUserMenuOpen(false)
      }
    }
    
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }, [router])

  const openCart = () => {
    setCartOpen(true)
    setMobileMenuOpen(false)
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)
  const closeUserMenu = () => setUserMenuOpen(false)

  const isLoggedIn = !!user
  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const profileImage = user?.profileImage

  const alwaysItems = [
    { type: 'link' as const, href: '/', label: 'Home', icon: Home },
    { type: 'link' as const, href: '/reviews', label: 'Reviews', icon: Star },
    { type: 'link' as const, href: '/about', label: 'About Us', icon: Info },
    { type: 'link' as const, href: '/contact', label: 'Contact Us', icon: HelpCircle },
    { type: 'action' as const, label: 'Cart', icon: ShoppingCart, onClick: openCart },
  ]

  const loggedInOnlyItems = [
    { type: 'link' as const, href: '/account/payments', label: 'Order History', icon: Clock },
    { type: 'link' as const, href: '/account/settings', label: 'Settings', icon: Settings },
    { type: 'link' as const, href: '/account/addresses', label: 'Addresses', icon: MapPin },
  ]

  // Navigation handler for dropdown items
  const handleNavigation = (href: string) => {
    closeUserMenu()
    router.push(href)
  }

  return (
    <>
      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5); } 80% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); } 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); } }
        .whatsapp-float { animation: float 2s ease-in-out infinite; }
        .whatsapp-pulse { animation: pulse-ring 1.5s infinite; }
      `}</style>

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        {/* DESKTOP HEADER */}
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
            <SearchBar />
            <button onClick={openCart} className="relative p-1">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F97316] text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
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
                <div className="relative" ref={desktopDropdownRef}>
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)} 
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#F97316]"
                  >
                    {profileImage ? (
                      <Image src={profileImage} alt={displayName} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
                    <span>{displayName}</span>
                  </button>
                  
                  {/* DESKTOP DROPDOWN - COMPLETELY REWRITTEN */}
                  {userMenuOpen && (
                    <div 
                      className="fixed md:absolute right-4 md:right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-[9999]"
                      style={{ 
                        top: 'auto',
                        position: 'fixed',
                        marginTop: '8px',
                        transform: 'translateY(0)',
                      }}
                    >
                      {/* My Profile */}
                      <button
                        onClick={() => handleNavigation('/account/profile')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors text-left"
                      >
                        <User size={16} />
                        My Profile
                      </button>
                      
                      {/* Addresses */}
                      <button
                        onClick={() => handleNavigation('/account/addresses')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors text-left"
                      >
                        <MapPin size={16} />
                        Addresses
                      </button>
                      
                      {/* Order History */}
                      <button
                        onClick={() => handleNavigation('/account/payments')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors text-left"
                      >
                        <Clock size={16} />
                        Order History
                      </button>
                      
                      {/* Settings */}
                      <button
                        onClick={() => handleNavigation('/account/settings')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors text-left"
                      >
                        <Settings size={16} />
                        Settings
                      </button>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      {/* Logout */}
                      <button
                        onClick={async (e) => {
                          e.preventDefault()
                          await logout()
                          closeUserMenu()
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE HEADER */}
        <div className="md:hidden flex items-center justify-between px-4 py-3">
          <button onClick={() => setMobileMenuOpen(true)} aria-label="Menu" className="p-1">
            <Menu size={24} />
          </button>
          
          <Link href="/" className="flex items-center gap-2">
            <img src={logoSrc} alt="Logo" className="h-8" />
            <span className="text-lg font-semibold text-gray-800">Spectrum<span className="text-[#F97316]">Cosmo</span></span>
          </Link>
          
          <div className="flex items-center gap-2">
            {/* Profile Icon - Mobile */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)} 
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-orange-50 transition-colors overflow-hidden"
                aria-label="User menu"
              >
                {profileImage ? (
                  <Image 
                    src={profileImage} 
                    alt={displayName} 
                    width={32} 
                    height={32} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={18} className="text-gray-600" />
                )}
              </button>
              
              {/* MOBILE DROPDOWN */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-[9999]">
                  {!isLoggedIn ? (
                    <>
                      <button
                        onClick={() => handleNavigation('/login')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors text-left"
                      >
                        <User size={16} />
                        Sign In
                      </button>
                      <button
                        onClick={() => handleNavigation('/signup')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors text-left"
                      >
                        <User size={16} />
                        Create Account
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleNavigation('/account/profile')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors text-left"
                      >
                        <User size={16} />
                        My Profile
                      </button>
                      <button
                        onClick={() => handleNavigation('/account/addresses')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors text-left"
                      >
                        <MapPin size={16} />
                        Addresses
                      </button>
                      <button
                        onClick={() => handleNavigation('/account/payments')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors text-left"
                      >
                        <Clock size={16} />
                        Order History
                      </button>
                      <button
                        onClick={() => handleNavigation('/account/settings')}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#F97316] transition-colors text-left"
                      >
                        <Settings size={16} />
                        Settings
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={async () => {
                          await logout()
                          closeUserMenu()
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Cart Button */}
            <button onClick={openCart} className="relative p-1" aria-label="Cart">
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F97316] text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU (SIDEBAR) */}
      {mobileMenuOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/50 md:hidden" onClick={closeMobileMenu}>
          <div className="absolute left-0 top-0 w-[85%] max-w-sm h-full bg-white p-5 overflow-y-auto shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-3">
              <span className="font-semibold">Menu</span>
              <button onClick={closeMobileMenu} aria-label="Close menu">
                <X size={22} />
              </button>
            </div>

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
                <button onClick={() => handleNavigation('/account/profile')} className="text-[#F97316] text-xs">
                  Profile
                </button>
              ) : (
                <button onClick={() => handleNavigation('/login')} className="text-[#F97316] text-xs">
                  Sign in / Register
                </button>
              )}
            </div>

            <div className="mt-3 py-2 border-t border-b border-gray-100">
              <CurrencySelector />
            </div>

            {/* View Products Button */}
            <button 
              onClick={() => {
                handleNavigation('/products');
                closeMobileMenu();
              }}
              className="my-3 block w-full bg-gradient-to-r from-[#F97316] to-orange-500 hover:from-orange-600 hover:to-orange-700 p-3.5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-base">View Products</span>
                <div className="flex items-center gap-1 text-white">
                  <span className="text-sm font-medium">Shop now</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </button>

            <div className="flex flex-col gap-2 mt-2 flex-grow">
              {alwaysItems.map(item => {
                const Icon = item.icon
                if (item.type === 'action') {
                  return (
                    <button 
                      key={item.label} 
                      onClick={() => { 
                        item.onClick(); 
                        closeMobileMenu(); 
                      }} 
                      className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg transition text-left"
                    >
                      <Icon size={18} /> {item.label}
                    </button>
                  )
                }
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      handleNavigation(item.href);
                      closeMobileMenu();
                    }}
                    className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg transition text-left"
                  >
                    <Icon size={18} /> {item.label}
                  </button>
                )
              })}
              {isLoggedIn && loggedInOnlyItems.map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      handleNavigation(item.href);
                      closeMobileMenu();
                    }}
                    className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg transition text-left"
                  >
                    <Icon size={18} /> {item.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 pt-3 border-t border-gray-200">
              {isLoggedIn ? (
                <button 
                  onClick={async () => {
                    await logout();
                    closeMobileMenu();
                  }} 
                  className="text-red-600 flex items-center gap-2 px-2 py-2 w-full text-left hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut size={18} /> Log out
                </button>
              ) : (
                <div className="text-xs text-gray-400 text-center py-2">
                  <button onClick={() => handleNavigation('/signup')} className="text-[#F97316]">Create an account</button> to enjoy order history and more.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

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
