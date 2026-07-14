'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Package,
  CreditCard,
  MapPin,
  Truck,
  Settings,
  Heart,
  User,
  HelpCircle,
  Menu,
  X,
  Loader2,
  Home,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/components/storefront/SettingsProvider';
import clsx from 'clsx';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
};

// Skeleton loader for user greeting
function UserGreetingSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[var(--background-secondary)] animate-pulse" />
      <div className="flex-1">
        <div className="h-4 bg-[var(--background-secondary)] rounded w-24 mb-1 animate-pulse" />
        <div className="h-3 bg-[var(--background-secondary)] rounded w-32 animate-pulse" />
      </div>
    </div>
  );
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const { resolvedTheme } = useSettings();

  // Logo based on dark mode setting
  const logoSrc = resolvedTheme === 'dark'
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png";

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Overview', href: '/account', icon: LayoutDashboard },
    { name: 'Orders', href: '/account/orders', icon: Package },
    { name: 'Wishlist', href: '/account/wishlist', icon: Heart },
    { name: 'Notifications', href: '/account/notifications', icon: Bell },
    { name: 'Profile', href: '/account/profile', icon: User },
    { name: 'Addresses', href: '/account/addresses', icon: MapPin },
    { name: 'Tracking', href: '/account/tracking', icon: Truck },
    { name: 'Support', href: '/account/support', icon: HelpCircle },
    { name: 'Settings', href: '/account/settings', icon: Settings },
  ];

  // Fetch user data
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data?.user) setUser(data.user);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to load user in layout:', errorMessage);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const SidebarContent = () => (
    <>
      {/* Logo + Brand */}
      <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
        <div className="relative h-10 w-auto">
          <Image 
            src={logoSrc} 
            alt="SpectrumCosmo" 
            width={40} 
            height={40}
            className="h-10 w-auto"
            priority
          />
        </div>
        <div>
          <h2 className="font-bold text-[var(--foreground)] text-lg">My Account</h2>
          <p className="text-xs text-[var(--foreground-muted)]">Manage everything in one place</p>
        </div>
      </div>

      {/* User Greeting - With Manga Panel */}
      <div className="mx-4 mt-4 manga-bg cards-manga rounded-xl overflow-hidden">
        <div className="relative z-10 p-3 bg-[var(--primary)]/10">
          <div className="flex items-center gap-3">
            {/* Profile picture or fallback */}
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center overflow-hidden">
              {loadingUser ? (
                <Loader2 className="animate-spin text-[var(--primary)] w-4 h-4" />
              ) : user?.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user.name || 'Profile'}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-[var(--primary)]" />
              )}
            </div>
            <div>
              {loadingUser ? (
                <UserGreetingSkeleton />
              ) : (
                <>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Welcome back, {user?.name?.split(' ')[0] || 'Guest'}
                  </p>
                  <p className="text-xs text-[var(--primary)]">
                    {user?.email || 'Spectrum Member'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1.5 flex-1" aria-label="Account navigation">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && item.href !== '/account' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20'
                  : 'text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon size={18} className={active ? 'text-white' : 'text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]'} />
              {item.name}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" aria-hidden="true"></span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border)] text-[10px] text-[var(--foreground-muted)] text-center">
        SpectrumCosmo © 2026
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="flex relative">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex md:w-72 flex-col bg-[var(--background-card)] backdrop-blur-sm border-r border-[var(--border)] sticky top-0 h-screen shadow-sm">
          <SidebarContent />
        </aside>

        {/* MOBILE FLOATING BUTTON */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="bg-[var(--primary)] text-white p-3 rounded-full shadow-lg hover:bg-[var(--primary-hover)] transition"
            aria-label="Open mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={22} />
          </button>
        </div>

        {/* MOBILE DRAWER OVERLAY */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-0 top-0 bottom-0 w-[80%] max-w-sm bg-[var(--background-card)] shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 border-r border-[var(--border)]">
              <div className="flex justify-end p-4">
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-1 rounded-full hover:bg-[var(--background-secondary)]"
                  aria-label="Close mobile menu"
                >
                  <X size={22} className="text-[var(--foreground)]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent />
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
