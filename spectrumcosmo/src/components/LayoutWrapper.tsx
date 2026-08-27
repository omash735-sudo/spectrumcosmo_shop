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
  '/login',
  '/signup',
  '/register',
  '/reset-password',
  '/forgot-password',
  '/welcome',
  '/verify-email',
  '/account/profile',
  '/account/orders',
  '/account/wishlist',
];

// Pages that have their own search/header built in
// so MobileHeader + MobileSearchBar should be suppressed
const NO_MOBILE_HEADER_PATHS = [
  '/products',
  '/account',
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

  // Suppress MobileHeader + MobileSearchBar on pages
  // that have their own navigation/search built in
  const suppressMobileHeader = NO_MOBILE_HEADER_PATHS.some(path => {
    if (EXACT_MATCH_ONLY.includes(path)) return pathname === path;
    return pathname?.startsWith(path);
  });

  if (isNoNavPage) {
    return <>{children}</>;
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
