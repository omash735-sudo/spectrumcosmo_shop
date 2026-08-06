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
  ArrowRight,
  CalendarDays,
  Gift,
  Zap,
  MessageCircle,
  MessageSquare,
  Headphones,
  Bot,
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
import { useUser } from '@/components/storefront/UserProvider';
import ChatWidget from '@/components/chat/ChatWidget';

const categories = [
  { name: 'T-Shirts', href: '/products?category=T-Shirts' },
  { name: 'Hoodies', href: '/products?category=Hoodies' },
  { name: 'Accessories', href: '/products?category=Accessories' },
  { name: 'Anime Jerseys', href: '/products?category=Anime Jerseys' },
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
const WHATSAPP_MESSAGE = 'Hi, I need assistance with SpectrumCosmo.';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const HIDE_CHAT_PATHS = [
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

const iconMap: Record<string, any> = {
  Truck,
  Shield,
  Tag,
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
  const { user: contextUser } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const { totalItems } = useCart();
  const { resolvedTheme } = useSettings();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const user = contextUser;

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (user) {
      const fetchUnreadCount = async () => {
        try {
          const res = await fetch('/api/notifications/unread-count');
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.count || 0);
          }
        } catch (err) {
          console.error('Failed to fetch unread count:', err);
        }
      };
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [user]);

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

  const showChat = !HIDE_CHAT_PATHS.some(path => pathname?.startsWith(path));

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';

  const logoSrc = currentTheme === 'dark'
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png";

  const openCart = () => {
    setCartOpen(true);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isLoggedIn = !!user;
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const profileImage = user?.profileImage;

  const showBanner = bannerData?.is_active !== false &&
    bannerData?.items &&
    bannerData.items.length > 0;
  const bgColor = bannerData?.background_color || 'var(--primary)';
  const textColor = bannerData?.text_color || '#FFFFFF';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/?t=' + Date.now());
  };

  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

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
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes float-bot {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .whatsapp-float { animation: float 2s ease-in-out infinite; }
        .whatsapp-pulse { animation: pulse-ring 1.5s infinite; }
        .dropdown-content {
          animation: slide-down 0.2s ease-out;
        }
        .banner-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .chat-bubble-float {
          animation: float-bot 2.5s ease-in-out infinite;
        }
      `}</style>

      <header className={clsx(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[var(--background-card)]/95 shadow-lg backdrop-blur-md'
          : 'bg-[var(--background-card)]/90 backdrop-blur-md border-b border-[var(--border)]'
      )}>

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

        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                <img src={logoSrc} alt="SpectrumCosmo" className="h-9 w-auto transition-transform group-hover:scale-105" />
                <span className="text-xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--foreground-muted)] bg-clip-text text-transparent">
                  Spectrum<span className="text-[var(--primary)]">Cosmo</span>
                </span>
              </Link>

              <nav className="flex items-center gap-1">
                {desktopLinks.map(link => {
                  const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));

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
                          {categories.map((cat) => (
                            <Link
                              key={cat.name}
                              href={cat.href}
                              className="flex items-center px-4 py-2.5 text-sm text-[var(--foreground-muted)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] transition group"
                              onClick={() => setOpenDropdown(null)}
                            >
                              {cat.name}
                            </Link>
                          ))}
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

              <div className="flex items-center gap-2">
                <CurrencySelector />
                <SearchBar />

                {isLoggedIn && unreadCount > 0 && <NotificationBell />}

                <button
                  onClick={openCart}
                  className="relative p-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
                  aria-label="Cart"
                  data-onboarding="cart"
                >
                  <ShoppingCart size={20} className="text-[var(--foreground-muted)]" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[10px] font-bold min-w-[18px] h-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </button>

                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block lg:hidden">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
                <img src={logoSrc} alt="SpectrumCosmo" className="h-8 w-auto transition-transform group-hover:scale-105" />
                <span className="text-lg font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--foreground-muted)] bg-clip-text text-transparent">
                  Spectrum<span className="text-[var(--primary)]">Cosmo</span>
                </span>
              </Link>
              <nav className="flex items-center gap-0.5 flex-1 justify-center px-2 overflow-x-auto">
                {desktopLinks.slice(0, 4).map(link => {
                  const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={clsx(
                        'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap',
                        isActive
                          ? 'bg-[var(--primary)] text-white shadow-sm'
                          : 'text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--primary)]'
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isLoggedIn && unreadCount > 0 && <NotificationBell />}
                <button
                  onClick={openCart}
                  className="relative p-1.5 rounded-full hover:bg-[var(--background-secondary)] transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
                  aria-label="Cart"
                  data-onboarding="cart"
                >
                  <ShoppingCart size={18} className="text-[var(--foreground-muted)]" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[9px] font-bold min-w-[16px] h-3.5 px-1 rounded-full flex items-center justify-center shadow-sm">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </button>
                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden px-3 py-2.5">
          <div className="flex items-center justify-between gap-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
              aria-label="Menu"
            >
              <Menu size={22} className="text-[var(--foreground-muted)]" />
            </button>

            <Link href="/" className="flex items-center gap-1.5 flex-shrink-0 min-w-0">
              <img src={logoSrc} alt="SpectrumCosmo" className="h-6 w-auto" />
              <span className="text-sm font-bold text-[var(--foreground)] truncate">
                Spectrum<span className="text-[var(--primary)]">Cosmo</span>
              </span>
            </Link>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              {isLoggedIn && unreadCount > 0 && <NotificationBell />}
              <UserMenu />
              <button
                onClick={openCart}
                className="relative p-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
                aria-label="Cart"
                data-onboarding="cart"
              >
                <ShoppingCart size={19} className="text-[var(--foreground-muted)]" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[9px] font-bold min-w-[15px] h-3.5 px-1 rounded-full flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/50 md:hidden" onClick={closeMobileMenu}>
          <div className="absolute left-0 top-0 w-[85%] max-w-sm h-full bg-[var(--background-card)] shadow-2xl flex flex-col animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <img src={logoSrc} alt="Logo" className="h-7 w-auto" />
                <span className="font-bold text-[var(--foreground)]">Menu</span>
              </div>
              <button onClick={closeMobileMenu} className="p-2 rounded-full hover:bg-[var(--background-secondary)] transition flex items-center justify-center min-h-[44px] min-w-[44px]">
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
                  <Link
                    href="/account/profile"
                    onClick={closeMobileMenu}
                    className="bg-[var(--primary)] text-white font-bold text-sm px-4 py-2 rounded-full hover:bg-[var(--primary-hover)] transition-colors shadow-sm flex items-center justify-center min-h-[44px]"
                  >
                    Profile
                  </Link>
                ) : (
                  <Link href="/login" onClick={closeMobileMenu} className="text-xs bg-[var(--primary)] text-white font-semibold px-4 py-2 rounded-full hover:bg-[var(--primary-hover)] flex items-center justify-center min-h-[44px]">
                    Sign In
                  </Link>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-b border-[var(--border)]">
              <CurrencySelector />
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)] min-h-[44px]">
                <Home size={18} className="text-[var(--foreground-muted)]" /> Home
              </Link>
              <Link href="/products" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)] min-h-[44px]">
                <Package size={18} className="text-[var(--foreground-muted)]" /> Products
              </Link>
              <Link href="/events" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)] min-h-[44px]">
                <CalendarDays size={18} className="text-[var(--foreground-muted)]" /> Events
              </Link>
              <Link href="/reviews" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)] min-h-[44px]">
                <Star size={18} className="text-[var(--foreground-muted)]" /> Reviews
              </Link>
              <Link href="/about" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)] min-h-[44px]">
                <Info size={18} className="text-[var(--foreground-muted)]" /> About
              </Link>
              <Link href="/contact" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)] min-h-[44px]">
                <HelpCircle size={18} className="text-[var(--foreground-muted)]" /> Contact
              </Link>
              <Link href="/faq" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--background-secondary)] transition text-[var(--foreground-muted)] min-h-[44px]">
                <HelpCircle size={18} className="text-[var(--foreground-muted)]" /> FAQ
              </Link>
            </div>

            <div className="p-5 border-t border-[var(--border)]">
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2.5 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition min-h-[44px]"
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

      {showChat && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
          <ChatWidget />
        </div>
      )}
    </>
  );
}
