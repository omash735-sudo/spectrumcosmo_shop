'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { COUNTRY_CURRENCY_MAP, DEFAULT_CURRENCY, CURRENCY_INFO } from '@/lib/currency';
import { useSettings } from './SettingsProvider';

type CurrencyContextType = {
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  convert: (amountInMwk: number, targetCurrency?: CurrencyCode) => number;
  setCurrency: (currency: CurrencyCode) => void;
  detectedCountry: string | null;
  isAutoDetected: boolean;
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const DEFAULT_RATES: Record<CurrencyCode, number> = {
  MWK: 1,
  USD: 0.00022,
  ZAR: 0.0041,
  EUR: 0.0002,
  NGN: 0.00067,
  GBP: 0.00017,
  KES: 0.00067,
  TZS: 0.0004,
  ZMW: 0.00004,
  ZWL: 0.000003,
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { settings, update } = useSettings();
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(DEFAULT_RATES);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const savedCurrency = localStorage.getItem('preferred_currency') as CurrencyCode | null;
        if (savedCurrency && CURRENCY_INFO[savedCurrency]) {
          setCurrencyState(savedCurrency);
          setIsAutoDetected(false);
        } else {
          const res = await fetch('/api/geo');
          const data = await res.json();
          setDetectedCountry(data.country_code);
          
          const countryInfo = COUNTRY_CURRENCY_MAP[data.country_code];
          if (countryInfo) {
            setCurrencyState(countryInfo.currency);
            setIsAutoDetected(true);
            update({ currency: countryInfo.currency });
          }
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Geo detection failed:', error);
        setCurrencyState(DEFAULT_CURRENCY);
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      detectCountry();
    }
  }, [isInitialized, update]);

  useEffect(() => {
    fetch('/api/exchange-rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setRates({
          MWK: 1,
          USD: 1 / data.MWK,
          ZAR: data.ZAR / data.MWK,
          EUR: data.EUR / data.MWK,
          NGN: data.NGN / data.MWK,
          GBP: data.GBP / data.MWK,
          KES: data.KES / data.MWK,
          TZS: data.TZS / data.MWK,
          ZMW: data.ZMW / data.MWK,
          ZWL: data.ZWL / data.MWK,
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
    setCurrencyState(newCurrency);
    setIsAutoDetected(false);
    localStorage.setItem('preferred_currency', newCurrency);
    update({ currency: newCurrency });
  };

  const value = useMemo(
    () => ({
      currency,
      rates,
      convert,
      setCurrency,
      detectedCountry,
      isAutoDetected,
    }),
    [currency, rates, detectedCountry, isAutoDetected]
  );

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

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
