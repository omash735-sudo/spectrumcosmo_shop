import type { Metadata } from 'next'
import './globals.css'

import { SettingsProvider } from '@/components/storefront/SettingsProvider'
import { CurrencyProvider } from '@/components/storefront/CurrencyProvider'
import { CartProvider } from '@/components/storefront/CartProvider'
import { UserProvider } from '@/components/storefront/UserProvider'
import ThemeSync from '@/components/storefront/ThemeSync'

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
        <UserProvider>
          <SettingsProvider>
            <ThemeSync>
              <CurrencyProvider>
                <CartProvider>
                  {children}
                </CartProvider>
              </CurrencyProvider>
            </ThemeSync>
          </SettingsProvider>
        </UserProvider>
      </body>
    </html>
  )
}
