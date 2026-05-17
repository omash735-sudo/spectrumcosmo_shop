'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Menu,
  X,
  ShoppingCart,
  User,
  HelpCircle,
  Star,
  Home,
  Clock,
  Info,
  MapPin,
  Heart,
  Package,
  Settings,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';

import CurrencySelector from '@/components/storefront/CurrencySelector';
import { useCart } from '@/components/storefront/CartProvider';
import CartDrawer from '@/components/storefront/CartDrawer';
import { useSettings } from '@/components/storefront/SettingsProvider';
import SearchBar from '@/components/storefront/SearchBar';
import UserMenu from '@/components/storefront/UserMenu';

const desktopLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/faq', label: 'FAQ' },
];

const WHATSAPP_NUMBER = '265893160202';
const WHATSAPP_MESSAGE = 'Hi, I am interested in purchasing products from SpectrumCosmo. Kindly assist me with catalog and ordering details.';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const HIDE_WHATSAPP_PATHS = [
  '/checkout', '/login', '/register', '/admin', '/dashboard',
  '/account/payments', '/account/settings', '/account/profile',
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { totalItems } = useCart();
  const { settings } = useSettings();
  const pathname = usePathname();
  const router = useRouter();

  const showWhatsApp = !HIDE_WHATSAPP_PATHS.some(path => pathname?.startsWith(path));

  const logoSrc = settings?.darkMode
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png";

  // Fetch user for sidebar display only
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => null);
  }, []);

  const openCart = () => {
    setCartOpen(true);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isLoggedIn = !!user;
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const profileImage = user?.profileImage;

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

            <UserMenu />
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
            <UserMenu />
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

      {/* MOBILE SIDEBAR – restored original style */}
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
                <Link href="/account/profile" onClick={closeMobileMenu} className="text-[#F97316] text-xs">Profile</Link>
              ) : (
                <Link href="/login" onClick={closeMobileMenu} className="text-[#F97316] text-xs">Sign in / Register</Link>
              )}
            </div>

            <div className="mt-3 py-2 border-t border-b border-gray-100">
              <CurrencySelector />
            </div>

            <button 
              onClick={() => {
                router.push('/products');
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
              <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg">
                <Home size={18} /> Home
              </Link>
              <Link href="/reviews" onClick={closeMobileMenu} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg">
                <Star size={18} /> Reviews
              </Link>
              <Link href="/about" onClick={closeMobileMenu} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg">
                <Info size={18} /> About Us
              </Link>
              <Link href="/contact" onClick={closeMobileMenu} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg">
                <HelpCircle size={18} /> Contact Us
              </Link>
              <Link href="/faq" onClick={closeMobileMenu} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg">
                <HelpCircle size={18} /> FAQ
              </Link>
              <button onClick={openCart} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg text-left">
                <ShoppingCart size={18} /> Cart
              </button>
              
              {isLoggedIn && (
                <>
                  <div className="border-t my-2"></div>
                  <Link href="/account/orders" onClick={closeMobileMenu} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg">
                    <Clock size={18} /> Order History
                  </Link>
                  <Link href="/account/settings" onClick={closeMobileMenu} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg">
                    <Settings size={18} /> Settings
                  </Link>
                  <Link href="/account/addresses" onClick={closeMobileMenu} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg">
                    <MapPin size={18} /> Addresses
                  </Link>
                  <Link href="/account/wishlist" onClick={closeMobileMenu} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg">
                    <Heart size={18} /> Wishlist
                  </Link>
                </>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-gray-200">
              {isLoggedIn ? (
                <button 
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    router.push('/');
                    closeMobileMenu();
                  }} 
                  className="text-red-600 flex items-center gap-2 px-2 py-2 w-full text-left hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut size={18} /> Log out
                </button>
              ) : (
                <div className="text-xs text-gray-400 text-center py-2">
                  <Link href="/signup" onClick={closeMobileMenu} className="text-[#F97316]">Create an account</Link> to enjoy order history and more.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {showWhatsApp && (
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-[9999] whatsapp-float">
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
  );
}
