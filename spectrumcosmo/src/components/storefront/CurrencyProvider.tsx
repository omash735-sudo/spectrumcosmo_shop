'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { useSettings } from './SettingsProvider';

type CurrencyContextType = {
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  convert: (amountInMwk: number, targetCurrency?: CurrencyCode) => number;
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

// Default rates: MWK is base currency (1 MWK = X)
const DEFAULT_RATES: Record<CurrencyCode, number> = {
  MWK: 1,        // Base currency
  USD: 0.00057,  // 1 MWK = 0.00057 USD (approximately 1 USD = 1750 MWK)
  ZAR: 0.0105,   // 1 MWK = 0.0105 ZAR
  EUR: 0.00053,  // 1 MWK = 0.00053 EUR
  GBP: 0.00045,  // 1 MWK = 0.00045 GBP
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const currency = settings.currency;

  const [rates, setRates] = useState<Record<CurrencyCode, number>>(DEFAULT_RATES);

  // fetch live rates and convert to MWK base
  useEffect(() => {
    fetch('/api/exchange-rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;

        // If API returns rates with USD as base (typical), convert to MWK base
        // Expected API response example: { USD: 1, MWK: 1750, ZAR: 18.5, EUR: 0.92 }
        const usdToMwk = data.MWK || 1750;
        
        setRates({
          MWK: 1,                                    // Base currency
          USD: 1 / usdToMwk,                        // 1 MWK = (1 / MWK rate) USD
          MWK: 1,
          ZAR: data.ZAR ? data.ZAR / usdToMwk : DEFAULT_RATES.ZAR,
          EUR: data.EUR ? data.EUR / usdToMwk : DEFAULT_RATES.EUR,
          GBP: data.GBP ? data.GBP / usdToMwk : DEFAULT_RATES.GBP,
        });
      })
      .catch(() => null);
  }, []);

  // Convert amount from MWK to target currency
  const convert = (amountInMwk: number, targetCurrency?: CurrencyCode) => {
    const target = targetCurrency || currency;
    const rate = rates[target] ?? 1;
    return amountInMwk * rate;
  };

  const value = useMemo(
    () => ({
      currency,
      rates,
      convert,
    }),
    [currency, rates]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
