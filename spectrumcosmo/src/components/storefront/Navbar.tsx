'use client';

import { useState, useEffect, useRef } from 'react';
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
  Bell,
  ChevronDown,
  Search,
  TrendingUp,
  Tag,
  Truck,
  Shield,
  Shirt,
  Package as PackageIcon,
  Sparkles,
  GraduationCap,
  ArrowRight,
  CalendarDays,
  Gift,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

import CurrencySelector from '@/components/storefront/CurrencySelector';
import { useCart } from '@/components/storefront/CartProvider';
import CartDrawer from '@/components/storefront/CartDrawer';
import { useSettings } from '@/components/storefront/SettingsProvider';
import SearchBar from '@/components/storefront/SearchBar';
import UserMenu from '@/components/storefront/UserMenu';
import NotificationBell from '@/components/ui/NotificationBell';
import { useTheme } from 'next-themes';

const categories = [
  { name: 'T-Shirts', href: '/products?category=T-Shirts', icon: Shirt },
  { name: 'Hoodies', href: '/products?category=Hoodies', icon: PackageIcon },
  { name: 'Accessories', href: '/products?category=Accessories', icon: Sparkles },
  { name: 'Anime Jerseys', href: '/products?category=Anime Jerseys', icon: GraduationCap },
];

const desktopLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products', hasDropdown: true },
  { href: '/events', label: 'Events' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const WHATSAPP_NUMBER = '265893160202';
const WHATSAPP_MESSAGE = 'Hi, I am interested in purchasing products from SpectrumCosmo. Kindly assist me with catalog and ordering details.';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const HIDE_WHATSAPP_PATHS = [
  '/checkout', '/login', '/register', '/admin', '/dashboard',
  '/account/payments', '/account/settings', '/account/profile',
];

interface BannerItem {
  icon: string;
  text: string;
}

interface BannerData {
  is_active: boolean;
  items: BannerItem[];
  background_color: string;
  text_color: string;
}

// Map icon strings to actual Lucide components
const iconMap: Record<string, any> = {
  Truck,
  Shield,
  Tag,
  Sparkles,
  Star,
  Heart,
  Gift,
  Zap,
  Clock,
  Package,
  ShoppingCart,
};

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Tag;
};

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const [bannerLoading, setBannerLoading] = useState(true);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const { totalItems } = useCart();
  const { resolvedTheme } = useSettings();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch banner data
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch('/api/banner');
        if (res.ok) {
          const data = await res.json();
          setBannerData(data);
        }
      } catch (err) {
        console.error('Failed to fetch banner:', err);
      } finally {
        setBannerLoading(false);
      }
    };
    fetchBanner();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 200);
  };

  const showWhatsApp = !HIDE_WHATSAPP_PATHS.some(path => pathname?.startsWith(path));

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';
  
  const logoSrc = currentTheme === 'dark'
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png";

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

  // Determine banner display - Fixed TypeScript error
  const showBanner = bannerData?.is_active !== false && 
    bannerData?.items && 
    bannerData.items.length > 0;
  const bgColor = bannerData?.background_color || 'var(--primary)';
  const textColor = bannerData?.text_color || '#FFFFFF';

  return (
    <>
      <style>{`
        @keyframes float { 
          0% { transform: translateY(0px); } 
          50% { transform: translateY(-6px); } 
          100% { transform: translateY(0px); } 
        }
        @keyframes pulse-ring { 
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5); } 
          80% { box-shadow: 0 0 0 10px rgba(37, 211, 102, 0); } 
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); } 
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .whatsapp-float { animation: float 2s ease-in-out infinite; }
        .whatsapp-pulse { animation: pulse-ring 1.5s infinite; }
        .dropdown-content {
          animation: slide-down 0.2s ease-out;
        }
        .banner-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>

      <header className={clsx(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled 
          ? 'bg-[var(--background-card)]/95 shadow-lg backdrop-blur-md' 
          : 'bg-[var(--background-card)]/90 backdrop-blur-md border-b border-[var(--border)]'
      )}>
        
        {/* Dynamic Top Banner */}
        {showBanner && !bannerLoading && (
          <div 
            className="hidden md:block text-center py-2 text-sm overflow-hidden"
            style={{ 
              backgroundColor: bgColor, 
              color: textColor 
            }}
          >
            <div className="flex items-center justify-center gap-6 whitespace-nowrap">
              {bannerData.items.map((item, index) => {
                const Icon = getIconComponent(item.icon);
                return (
                  <span key={index} className="flex items-center gap-1">
                    <Icon size={14} />
                    {item.text}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Banner - Marquee style for limited space */}
        {showBanner && !bannerLoading && (
          <div 
            className="md:hidden py-1.5 text-xs overflow-hidden"
            style={{ 
              backgroundColor: bgColor, 
              color: textColor 
            }}
          >
            <div className="flex whitespace-nowrap banner-marquee">
              {[...bannerData.items, ...bannerData.items].map((item, index) => {
                const Icon = getIconComponent(item.icon);
                return (
                  <span key={index} className="flex items-center gap-1 mx-4">
                    <Icon size={12} />
                    {item.text}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                <img src={logoSrc} alt="SpectrumCosmo" className="h-9 w-auto transition-transform group-hover:scale-105" />
                <span className="text-xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--foreground-muted)] bg-clip-text text-transparent">
                  Spectrum<span className="text-[var(--primary)]">Cosmo</span>
                </span>
              </Link>

              {/* Navigation */}
              <nav className="flex items-center gap-1">
                {desktopLinks.map(link => {
                  const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
                  
                  if (link.label === 'Events') {
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={clsx(
                          'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5',
                          isActive
                            ? 'bg-[var(--primary)] text-white shadow-sm'
                            : 'text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--primary)]'
                        )}
                      >
                        <CalendarDays size={16} className={isActive ? 'text-white' : 'text-[var(--primary)]'} />
                        {link.label}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={link.href}
                      className="relative"
                      onMouseEnter={() => link.hasDropdown && handleMouseEnter(link.label)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Link
                        href={link.href}
                        className={clsx(
                          'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1',
                          isActive
                            ? 'bg-[var(--primary)] text-white shadow-sm'
                            : 'text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--primary)]'
                        )}
                      >
                        {link.label}
                        {link.hasDropdown && <ChevronDown size={14} className={clsx('transition-transform', openDropdown === link.label && 'rotate-180')} />}
                      </Link>
                      
                      {link.hasDropdown && openDropdown === link.label && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--background-card)] rounded-xl shadow-lg border border-[var(--border)] py-2 z-50 dropdown-content">
                          <div className="px-4 py-2 border-b border-[var(--border)]">
                            <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Shop by Category</p>
                          </div>
                          {categories.map((cat) => {
                            const Icon = cat.icon;
                            return (
                              <Link
                                key={cat.name}
                                href={cat.href}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground-muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition group"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <Icon size={18} className="text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition" />
                                {cat.name}
                              </Link>
                            );
                          })}
                          <div className="border-t border-[var(--border)] mt-2 pt-2">
                            <Link href="/products" className="flex items-center justify-between px-4 py-2.5 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 transition group">
                              View All Products 
                              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Right Section */}
              <div className="flex items-center gap-2">
                <CurrencySelector />
                <SearchBar />
                
                {isLoggedIn && <NotificationBell />}
                
                <div className="relative group">
                  <button 
                    onClick={openCart} 
                    className="relative p-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors"
                    aria-label="Cart"
                  >
                    <ShoppingCart size={20} className="text-[var(--foreground-muted)]" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[10px] font-bold min-w-[18px] h-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                        {totalItems > 99 ? '99+' : totalItems}
                      </span>
                    )}
                  </button>
                </div>

                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="p-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors"
              aria-label="Menu"
            >
              <Menu size={22} className="text-[var(--foreground-muted)]" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <img src={logoSrc} alt="SpectrumCosmo" className="h-7 w-auto" />
              <span className="text-base font-bold text-[var(--foreground)]">
                Spectrum<span className="text-[var(--primary)]">Cosmo</span>
              </span>
            </Link>

            <div className="flex items-center gap-1">
              {isLoggedIn && <NotificationBell />}
              <UserMenu />
              <button 
                onClick={openCart} 
                className="relative p-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart size={20} className="text-[var(--foreground-muted)]" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/50 md:hidden" onClick={closeMobileMenu}>
          <div className="absolute left-0 top-0 w-[85%] max-w-sm h-full bg-[var(--background-card)] shadow-2xl flex flex-col animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <img src={logoSrc} alt="Logo" className="h-7 w-auto" />
                <span className="font-bold text-[var(--foreground)]">Menu</span>
              </div>
              <button onClick={closeMobileMenu} className="p-2 rounded-full hover:bg-[var(--background-secondary)] transition">
                <X size={20} className="text-[var(--foreground-muted)]" />
              </button>
            </div>

            <div className="p-5 bg-[var(--background-secondary)] border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {profileImage ? (
                    <Image src={profileImage} alt={displayName} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
                      <User size={18} className="text-[var(--primary)]" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{displayName}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{isLoggedIn ? 'Logged in' : 'Guest'}</p>
                  </div>
                </div>
                {isLoggedIn ? (
                  <Link href="/account/profile" onClick={closeMobileMenu} className="text-xs text-[var(--primary)] font-medium hover:underline">
                    Profile
                  </Link>
                ) : (
                  <Link href="/login" onClick={closeMobileMenu} className="text-xs bg-[var(--primary)] text-white px-3 py-1 rounded-full hover:bg-[var(--primary-hover)]">
                    Sign In
                  </Link>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-b border-[var(--border)]">
              <CurrencySelector />
            </div>

            <button 
              onClick={() => {
                router.push('/products');
                closeMobileMenu();
              }}
              className="mx-5 mt-5 block bg-[var(--primary)] hover:bg-[var(--primary-hover)] p-3.5 rounded-xl transition-all duration-200 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Shop Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </div>
            </button>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)]">
                <Home size={18} className="text-[var(--foreground-muted)]" /> Home
              </Link>
              <Link href="/products" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)]">
                <Package size={18} className="text-[var(--foreground-muted)]" /> Products
              </Link>
              <Link href="/events" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)]">
                <CalendarDays size={18} className="text-[var(--primary)]" /> Events
              </Link>
              <Link href="/reviews" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)]">
                <Star size={18} className="text-[var(--foreground-muted)]" /> Reviews
              </Link>
              <Link href="/about" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)]">
                <Info size={18} className="text-[var(--foreground-muted)]" /> About
              </Link>
              <Link href="/contact" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)]">
                <HelpCircle size={18} className="text-[var(--foreground-muted)]" /> Contact
              </Link>
              <Link href="/faq" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)]">
                <HelpCircle size={18} className="text-[var(--foreground-muted)]" /> FAQ
              </Link>
              
              <button onClick={openCart} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-left text-[var(--foreground-muted)]">
                <ShoppingCart size={18} className="text-[var(--foreground-muted)]" /> Cart
                {totalItems > 0 && (
                  <span className="ml-auto bg-[var(--primary)]/10 text-[var(--primary)] text-xs px-2 py-0.5 rounded-full">{totalItems}</span>
                )}
              </button>
              
              {isLoggedIn && (
                <>
                  <div className="border-t my-3 mx-3 border-[var(--border)]"></div>
                  <Link href="/account/orders" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)]">
                    <Clock size={18} className="text-[var(--foreground-muted)]" /> Orders
                  </Link>
                  <Link href="/account/wishlist" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)]">
                    <Heart size={18} className="text-[var(--foreground-muted)]" /> Wishlist
                  </Link>
                  <Link href="/account/settings" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)]">
                    <Settings size={18} className="text-[var(--foreground-muted)]" /> Settings
                  </Link>
                </>
              )}
            </div>

            <div className="p-5 border-t border-[var(--border)]">
              {isLoggedIn ? (
                <button 
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    router.push('/');
                    closeMobileMenu();
                  }} 
                  className="flex items-center gap-2 px-3 py-2.5 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                >
                  <LogOut size={18} /> Log out
                </button>
              ) : (
                <div className="text-center text-xs text-[var(--foreground-muted)]">
                  New customer? <Link href="/signup" onClick={closeMobileMenu} className="text-[var(--primary)] font-medium">Create account</Link>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* WhatsApp Float Button */}
      {showWhatsApp && (
        <a 
          href={WHATSAPP_URL} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="fixed bottom-12 right-6 z-[9999] whatsapp-float md:bottom-14 md:right-8"
        >
          <div className="relative">
            <div className="whatsapp-pulse absolute inset-0 rounded-full"></div>
            <div className="bg-green-500 rounded-full p-3 shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center md:p-3.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5 md:w-6 md:h-6">
                <path d="M12.032 2.5C6.49 2.5 2 6.99 2 12.532c0 2.12.65 4.09 1.76 5.73L2 21.5l3.42-.98c1.57.93 3.4 1.48 5.36 1.48 5.54 0 10.03-4.49 10.03-10.03S17.57 2.5 12.032 2.5zm0 18.48c-1.75 0-3.38-.5-4.78-1.38l-.34-.2-2.03.58.58-2.02-.22-.35a7.86 7.86 0 0 1-1.4-4.44c0-4.33 3.53-7.85 7.85-7.85 4.33 0 7.85 3.52 7.85 7.85-.01 4.32-3.53 7.85-7.86 7.85zm4.21-5.88c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.52.12-.15.24-.59.76-.72.92-.13.15-.27.17-.5.05-.23-.12-.97-.36-1.85-1.14-.68-.6-1.14-1.34-1.28-1.57-.13-.23-.01-.36.1-.48.1-.1.23-.26.34-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.52-1.26-.72-1.73-.18-.45-.37-.37-.52-.38-.13-.01-.29-.01-.44-.01s-.4.06-.61.29c-.21.23-.8.78-.8 1.9s.82 2.2.93 2.36c.11.15 1.6 2.44 3.88 3.42.54.23.96.37 1.29.47.54.17 1.03.14 1.42.09.43-.05 1.38-.56 1.57-1.11.19-.54.19-1 .13-1.1-.06-.1-.22-.16-.46-.28z" />
              </svg>
            </div>
          </div>
        </a>
      )}
    </>
  );
}
