'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { useSettings } from './SettingsProvider';

type CurrencyContextType = {
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  convert: (amountInMwk: number, targetCurrency?: CurrencyCode) => number;
  setCurrency: (currency: CurrencyCode) => void;
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const DEFAULT_RATES: Record<CurrencyCode, number> = {
  MWK: 1,
  USD: 0.00057,
  ZAR: 0.0105,
  EUR: 0.00053,
  GBP: 0.00045,
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { settings, update } = useSettings();
  const currency = settings.currency;

  const [rates, setRates] = useState<Record<CurrencyCode, number>>(DEFAULT_RATES);

  useEffect(() => {
    fetch('/api/exchange-rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const usdToMwk = data.MWK || 1750;
        setRates({
          MWK: 1,
          USD: 1 / usdToMwk,
          ZAR: data.ZAR ? data.ZAR / usdToMwk : DEFAULT_RATES.ZAR,
          EUR: data.EUR ? data.EUR / usdToMwk : DEFAULT_RATES.EUR,
          GBP: data.GBP ? data.GBP / usdToMwk : DEFAULT_RATES.GBP,
        });
      })
      .catch(() => null);
  }, []);

  const convert = (amountInMwk: number, targetCurrency?: CurrencyCode) => {
    const target = targetCurrency || currency;
    const rate = rates[target] ?? 1;
    return amountInMwk * rate;
  };

  const setCurrency = (newCurrency: CurrencyCode) => {
    update({ currency: newCurrency });
  };

  const value = useMemo(
    () => ({
      currency,
      rates,
      convert,
      setCurrency,
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
