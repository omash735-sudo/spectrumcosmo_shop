import type { Metadata } from 'next'
import './globals.css'

import { CurrencyProvider } from '@/components/storefront/CurrencyProvider'
import { CartProvider } from '@/components/storefront/CartProvider'
import Navbar from '@/components/storefront/Navbar'

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

            {/* TOP NAVBAR (GLOBAL) */}
            <Navbar />

            {/* PAGE CONTENT */}
            <main className="min-h-screen">
              {children}
            </main>

          </CartProvider>
        </CurrencyProvider>

      </body>
    </html>
  )
}
