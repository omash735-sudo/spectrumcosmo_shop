import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'

import { SettingsProvider } from '@/components/storefront/SettingsProvider'
import { CurrencyProvider } from '@/components/storefront/CurrencyProvider'
import { CartProvider } from '@/components/storefront/CartProvider'
import { UserProvider } from '@/components/storefront/UserProvider'
import { WishlistProvider } from '@/components/storefront/WishlistProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'SpectrumCosmo — Wear Your Excitement With Pride',
  description: 'Custom apparel and anime merchandise. T-shirts, hoodies, pendants, bracelets — every piece tells your story.',
  keywords: 'anime merchandise, custom apparel, anime t-shirts, hoodies, pendants, bracelets',
  authors: [{ name: 'SpectrumCosmo' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#F97316',
  openGraph: {
    title: 'SpectrumCosmo — Wear Your Excitement With Pride',
    description: 'Custom apparel and anime merchandise handcrafted for those who live boldly.',
    type: 'website',
    siteName: 'SpectrumCosmo',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased font-body">
        <ErrorBoundary>
          <UserProvider>
            <SettingsProvider>
              <CurrencyProvider>
                <CartProvider>
                  <WishlistProvider>
                    <Suspense fallback={<LoadingSpinner />}>
                      {children}
                    </Suspense>
                  </WishlistProvider>
                </CartProvider>
              </CurrencyProvider>
            </SettingsProvider>
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
