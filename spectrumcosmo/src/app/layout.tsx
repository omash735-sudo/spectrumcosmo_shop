import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { 
  M_PLUS_1p,
  Noto_Sans_JP,
  Zen_Maru_Gothic,
  RocknRoll_One,
  Train_One,
  DotGothic16,
  Yusei_Magic,
  Reggae_One,
} from 'next/font/google';
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

const mPlus1p = M_PLUS_1p({
  weight: ['400', '700', '800', '900'],
  subsets: ['latin', 'cyrillic', 'latin-ext', 'vietnamese'],
  variable: '--font-mplus',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  weight: ['400', '500', '700', '800', '900'],
  subsets: ['latin', 'cyrillic', 'latin-ext', 'vietnamese'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const zenMaruGothic = Zen_Maru_Gothic({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin', 'cyrillic', 'greek', 'latin-ext'],
  variable: '--font-zen-maru',
  display: 'swap',
});

const rocknRoll = RocknRoll_One({
  weight: ['400'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-rocknroll',
  display: 'swap',
});

const trainOne = Train_One({
  weight: ['400'],
  subsets: ['latin', 'cyrillic', 'latin-ext'],
  variable: '--font-train',
  display: 'swap',
});

const dotGothic = DotGothic16({
  weight: ['400'],
  subsets: ['latin', 'cyrillic', 'latin-ext'],
  variable: '--font-dot-gothic',
  display: 'swap',
});

const yuseiMagic = Yusei_Magic({
  weight: ['400'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-yusei',
  display: 'swap',
});

const reggaeOne = Reggae_One({
  weight: ['400'],
  subsets: ['latin', 'cyrillic', 'latin-ext'],
  variable: '--font-reggae',
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
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`
        ${mPlus1p.variable} 
        ${notoSansJP.variable} 
        ${zenMaruGothic.variable} 
        ${rocknRoll.variable} 
        ${trainOne.variable}
        ${dotGothic.variable}
        ${yuseiMagic.variable}
        ${reggaeOne.variable}
      `}
    >
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
        </ThemeProvider>
      </body>
    </html>
  );
}
