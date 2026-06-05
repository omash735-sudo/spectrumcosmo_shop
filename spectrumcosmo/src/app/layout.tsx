import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import './globals.css';

import { SettingsProvider } from '@/components/storefront/SettingsProvider';
import { CurrencyProvider } from '@/components/storefront/CurrencyProvider';
import { CartProvider } from '@/components/storefront/CartProvider';
import { UserProvider } from '@/components/storefront/UserProvider';
import { WishlistProvider } from '@/components/storefront/WishlistProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NotificationProvider } from '@/components/ui/CustomNotification';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F97316',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.shop'),
  title: {
    default: 'SpectrumCosmo — Wear Your Excitement With Pride',
    template: '%s | SpectrumCosmo',
  },
  description: 'Custom apparel and anime merchandise. T-shirts, hoodies, pendants, bracelets — every piece tells your story.',
  keywords: 'anime merchandise, custom apparel, anime t-shirts, hoodies, pendants, bracelets',
  authors: [{ name: 'SpectrumCosmo' }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: 'SpectrumCosmo — Wear Your Excitement With Pride',
    description: 'Custom apparel and anime merchandise handcrafted for those who live boldly.',
    siteName: 'SpectrumCosmo',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
        width: 1200,
        height: 630,
        alt: 'SpectrumCosmo Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpectrumCosmo — Wear Your Excitement With Pride',
    description: 'Custom apparel and anime merchandise handcrafted for those who live boldly.',
    images: ['https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-body">
        <ErrorBoundary>
          <UserProvider>
            <SettingsProvider>
              <CurrencyProvider>
                <CartProvider>
                  <WishlistProvider>
                    <NotificationProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        {children}
                      </Suspense>
                      <Toaster
                        position="top-right"
                        toastOptions={{
                          duration: 4000,
                          style: { background: '#363636', color: '#fff', borderRadius: '12px' },
                          success: { duration: 3000, iconTheme: { primary: '#22C55E', secondary: '#fff' } },
                          error: { duration: 4000, iconTheme: { primary: '#EF4444', secondary: '#fff' } },
                          loading: { duration: 3000, iconTheme: { primary: '#F97316', secondary: '#fff' } },
                        }}
                      />
                    </NotificationProvider>
                  </WishlistProvider>
                </CartProvider>
              </CurrencyProvider>
            </SettingsProvider>
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
