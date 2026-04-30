'use client'

import type { Metadata } from 'next'
import './globals.css'

import { CurrencyProvider } from '@/components/storefront/CurrencyProvider'
import { CartProvider } from '@/components/storefront/CartProvider'
import BottomNav from '@/components/storefront/BottomNav'
import Navbar from '@/components/storefront/Navbar'

import { usePathname } from 'next/navigation'

export const metadata: Metadata = {
  title: 'SpectrumCosmo — Wear Your Excitement With Pride',
  description: 'Custom apparel and anime merchandise.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const hideBottomNav =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/checkout')

  return (
    <html lang="en">
      <body className="antialiased">

        <CurrencyProvider>
          <CartProvider>

            {/* Desktop Navbar */}
            <Navbar />

            {/* Page Content */}
            <main className="pb-20 md:pb-0">
              {children}
            </main>

            {/* Mobile Bottom Nav */}
            {!hideBottomNav && (
              <div className="md:hidden">
                <BottomNav />
              </div>
            )}

          </CartProvider>
        </CurrencyProvider>

      </body>
    </html>
  )
}
