import type { Metadata } from 'next'
import './globals.css'

import { CurrencyProvider } from '@/components/storefront/CurrencyProvider'
import { CartProvider } from '@/components/storefront/CartProvider'
import BottomNav from '@/components/storefront/BottomNav'

export const metadata: Metadata = {
  title: 'SpectrumCosmo — Wear Your Excitement With Pride',
  description: 'Custom apparel and anime merchandise.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">

        <CurrencyProvider>
          <CartProvider>

            <div className="pb-20">
              {children}
            </div>

            <BottomNav />

          </CartProvider>
        </CurrencyProvider>

      </body>
    </html>
  )
}
