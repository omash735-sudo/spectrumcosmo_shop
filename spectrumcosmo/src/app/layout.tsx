import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Anton, Kanit, Bangers, Black_Han_Sans } from 'next/font/google';
import './globals.css';

import { ThemeProvider } from './providers';
import { SettingsProvider } from '@/components/storefront/SettingsProvider';
import { CurrencyProvider } from '@/components/storefront/CurrencyProvider';
import { CartProvider } from '@/components/storefront/CartProvider';
import { UserProvider } from '@/components/storefront/UserProvider';
import { WishlistProvider } from '@/components/storefront/WishlistProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NotificationProvider } from '@/components/ui/CustomNotification';
import TrackVisits from '@/components/TrackVisits';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import AppModeWrapper from '@/components/storefront/AppModeWrapper';
import PWAInstallPrompt from '@/components/storefront/PWAInstallPrompt';
import NativeStatusBar from '@/components/storefront/NativeStatusBar';

// ===== FONTS =====
const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
});

const kanit = Kanit({
  weight: ['400', '700', '900'],
  subsets: ['latin', 'thai'],
  variable: '--font-kanit',
  display: 'swap',
});

const bangers = Bangers({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bangers',
  display: 'swap',
});

const blackHanSans = Black_Han_Sans({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-black-han-sans',
  display: 'swap',
});

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
    icon: [
      { 
        url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426894/app_icon_orange_accent_wi0uge.svg',
        type: 'image/svg+xml',
      },
      { 
        url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426892/app_icon_dark_vhmfte.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      },
      { 
        url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426894/app_icon_light_ce1msw.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426896/app_icon_orange_accent_1024_kmjqwc.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
      {
        url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426890/app_icon_dark_1024_m4n3kk.png',
        sizes: '1024x1024',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426896/app_icon_light_1024_zcsd01.png',
        sizes: '1024x1024',
        type: 'image/png',
        media: '(prefers-color-scheme: light)',
      },
    ],
    apple: [
      {
        url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426891/app_icon_dark_ios_180_ygceyt.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426894/app_icon_orange_accent_wi0uge.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    shortcut: [
      {
        url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426892/app_icon_dark_vhmfte.svg',
        type: 'image/svg+xml',
      },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SpectrumCosmo',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'msapplication-TileColor': '#F97316',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${anton.variable} ${kanit.variable} ${bangers.variable} ${blackHanSans.variable}`}
    >
      <head>
        <link
          rel="mask-icon"
          href="https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426894/app_icon_orange_accent_wi0uge.svg"
          color="#F97316"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SpectrumCosmo" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426890/app_icon_dark_android_192_rcaktd.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426890/app_icon_dark_1024_m4n3kk.png"
        />
      </head>
      <body className="antialiased font-body">
        <ThemeProvider>
          <ErrorBoundary>
            <UserProvider>
              <SettingsProvider>
                <CurrencyProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <NotificationProvider>
                        <TrackVisits />
                        <NativeStatusBar />
                        <AppModeWrapper>
                          <>
                            <Navbar />
                            <Suspense fallback={<LoadingSpinner />}>
                              {children}
                            </Suspense>
                            <Footer />
                            <PWAInstallPrompt />
                          </>
                        </AppModeWrapper>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
