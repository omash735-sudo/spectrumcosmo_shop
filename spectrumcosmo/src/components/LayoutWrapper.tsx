'use client';

import { usePathname } from 'next/navigation';
import { useAppMode } from '@/hooks/useAppMode';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import MobileHeader from '@/components/storefront/MobileHeader';
import MobileSearchBar from '@/components/storefront/MobileSearchBar';
import MobileBottomNav from '@/components/storefront/MobileBottomNav';

// Routes where NO navigation should appear (both web and app)
const NO_NAV_PATHS = [
  '/login',
  '/signup',
  '/register',
  '/reset-password',
  '/forgot-password',
  '/welcome',
  '/verify-email',
];

// App routes where bottom nav should appear
const APP_BOTTOM_NAV_PATHS = [
  '/',
  '/products',
  '/cart',
  '/account',
  '/account/profile',
  '/account/orders',
  '/account/wishlist',
  '/events',
  '/reviews',
];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAppMode } = useAppMode();

  // Check if current path is auth/onboarding (no nav)
  const isNoNavPage = NO_NAV_PATHS.some(path => pathname?.startsWith(path));
  
  // Check if current path should show bottom nav in app
  const showAppBottomNav = APP_BOTTOM_NAV_PATHS.some(path => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  });

  // Auth/Onboarding pages - no navigation at all
  if (isNoNavPage) {
    return <>{children}</>;
  }

  // APP MODE - Application navigation
  if (isAppMode) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--background)]">
        <MobileHeader />
        <MobileSearchBar />
        <main className="flex-1 pb-[76px]">
          {children}
        </main>
        {showAppBottomNav && <MobileBottomNav />}
      </div>
    );
  }

  // WEBSITE MODE - Website navigation (responsive)
  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
