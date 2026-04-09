'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CurrencyCode } from '@/lib/currency'

type CurrencyContextType = {
  currency: CurrencyCode
  setCurrency: (currency: CurrencyCode) => void
  rates: Record<CurrencyCode, number>
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)
const STORAGE_KEY = 'spectrumcosmo_currency'

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD')
  const [rates, setRates] = useState<Record<CurrencyCode, number>>({
    USD: 1,
    MWK: 1750,
    ZAR: 18.5,
    EUR: 0.92,
  })

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'USD' || stored === 'MWK' || stored === 'ZAR' || stored === 'EUR') {
      setCurrencyState(stored)
    }

    fetch('/api/exchange-rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        if (data.USD && data.MWK && data.ZAR && data.EUR) {
          setRates({
            USD: Number(data.USD),
            MWK: Number(data.MWK),
            ZAR: Number(data.ZAR),
            EUR: Number(data.EUR),
          })
        }
      })
      .catch(() => null)
  }, [])

  const setCurrency = (nextCurrency: CurrencyCode) => {
    setCurrencyState(nextCurrency)
    window.localStorage.setItem(STORAGE_KEY, nextCurrency)
  }

  const value = useMemo(() => ({ currency, setCurrency, rates }), [currency, rates])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error('useCurrency must be used inside CurrencyProvider')
  }
  return ctx
}

