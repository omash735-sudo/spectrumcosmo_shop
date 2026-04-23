import type { Metadata } from 'next'
import './globals.css'

import { CurrencyProvider } from '@/components/storefront/CurrencyProvider'
import { CartProvider } from '@/components/storefront/CartProvider'
import LaunchOverlay from '@/components/LaunchOverlay'

export const metadata: Metadata = {
  title: 'SpectrumCosmo — Wear Your Excitement With Pride',
  description: 'Custom apparel and anime merchandise.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">

        {/* GLOBAL UNDER-CONSTRUCTION OVERLAY */}
        <LaunchOverlay />

        {/* APP PROVIDERS */}
        <CurrencyProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </CurrencyProvider>

      </body>
    </html>
  )
}
