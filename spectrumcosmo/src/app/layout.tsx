'use client'

import type { Metadata } from 'next'
import './globals.css'

import { useEffect } from 'react'
import { SettingsProvider, useSettings } from '@/components/storefront/SettingsProvider'
import { CurrencyProvider } from '@/components/storefront/CurrencyProvider'
import { CartProvider } from '@/components/storefront/CartProvider'
import { UserProvider } from '@/components/storefront/UserProvider'

export const metadata: Metadata = {
  title: 'SpectrumCosmo — Wear Your Excitement With Pride',
  description: 'Custom apparel and anime merchandise.',
}

function ThemeSync({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings.darkMode])

  return <>{children}</>
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
