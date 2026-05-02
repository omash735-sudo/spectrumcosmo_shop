'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CurrencyCode } from '@/lib/currency'
import { useSettings } from './SettingsProvider'

type CurrencyContextType = {
  currency: CurrencyCode
  rates: Record<CurrencyCode, number>
  convert: (amountInUsd: number, currency?: CurrencyCode) => number
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()
  const currency = settings.currency

  const [rates, setRates] = useState<Record<CurrencyCode, number>>({
    USD: 1,
    MWK: 1750,
    ZAR: 18.5,
    EUR: 0.92,
  })

  // fetch live rates
  useEffect(() => {
    fetch('/api/exchange-rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return

        setRates({
          USD: Number(data.USD ?? 1),
          MWK: Number(data.MWK ?? 1750),
          ZAR: Number(data.ZAR ?? 18.5),
          EUR: Number(data.EUR ?? 0.92),
        })
      })
      .catch(() => null)
  }, [])

  const convert = (amountInUsd: number, target?: CurrencyCode) => {
    const curr = target || currency
    return amountInUsd * rates[curr]
  }

  const value = useMemo(
    () => ({
      currency,
      rates,
      convert,
    }),
    [currency, rates]
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider')
  return ctx
}
