'use client';

import { usePathname } from 'next/navigation';
import { useAppMode } from '@/hooks/useAppMode';
import { usePlatform } from '@/hooks/usePlatform';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import MobileHeader from '@/components/storefront/MobileHeader';
import MobileSearchBar from '@/components/storefront/MobileSearchBar';
import MobileBottomNav from '@/components/storefront/MobileBottomNav';

const NO_NAV_PATHS = [
  '/auth',
  '/login',
  '/signup',
  '/register',
  '/reset-password',
  '/forgot-password',
  '/welcome',
  '/verify-email',
];

const NO_MOBILE_HEADER_PATHS = [
  '/products',
  '/account',
  '/account/profile',
  '/account/orders',
  '/account/wishlist',
];

const APP_BOTTOM_NAV_PATHS = [
  '/',
  '/products',
  '/cart',
  '/account',
  '/events',
  '/reviews',
];

const EXACT_MATCH_ONLY = ['/account'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAppMode } = useAppMode();
  const { isNative } = usePlatform();
  const showAppMode = isAppMode || isNative;

  const isNoNavPage = NO_NAV_PATHS.some(path => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  });

  const showAppBottomNav = APP_BOTTOM_NAV_PATHS.some(path => {
    if (EXACT_MATCH_ONLY.includes(path)) return pathname === path;
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  });

  const suppressMobileHeader = NO_MOBILE_HEADER_PATHS.some(path => {
    if (EXACT_MATCH_ONLY.includes(path)) return pathname === path;
    return pathname?.startsWith(path);
  });

  if (isNoNavPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <main className="flex-1 flex items-center justify-center">
          {children}
        </main>
      </div>
    );
  }

  if (showAppMode) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--background)]">
        {!suppressMobileHeader && <MobileHeader />}
        {!suppressMobileHeader && <MobileSearchBar />}
        <main className={showAppBottomNav ? 'flex-1 pb-[76px]' : 'flex-1'}>
          {children}
        </main>
        {showAppBottomNav && <MobileBottomNav />}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
