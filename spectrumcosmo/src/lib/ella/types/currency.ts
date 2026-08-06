import { COUNTRY_CURRENCY_MAP, DEFAULT_CURRENCY, formatCurrencyAmount, CurrencyCode } from '@/lib/geo-config';

export { COUNTRY_CURRENCY_MAP, DEFAULT_CURRENCY, formatCurrencyAmount };
export type { CurrencyCode };

export function detectCurrencyFromLocale(locale: string): CurrencyCode {
  const countryCode = locale.split('-')[1]?.toUpperCase() || locale.split('_')[1]?.toUpperCase() || '';
  
  if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
    return COUNTRY_CURRENCY_MAP[countryCode].currency as CurrencyCode;
  }
  
  return DEFAULT_CURRENCY as CurrencyCode;
}

export function detectCurrencyFromCountry(countryCode: string): CurrencyCode {
  const upper = countryCode.toUpperCase();
  if (COUNTRY_CURRENCY_MAP[upper]) {
    return COUNTRY_CURRENCY_MAP[upper].currency as CurrencyCode;
  }
  return DEFAULT_CURRENCY as CurrencyCode;
}

export function formatPrice(amountInMWK: number, currency: CurrencyCode, exchangeRate: number = 1): string {
  const convertedAmount = amountInMWK * exchangeRate;
  return formatCurrencyAmount(convertedAmount, currency);
}

export function getExchangeRate(currency: CurrencyCode): number {
  const rates: Record<CurrencyCode, number> = {
    MWK: 1,
    USD: 0.00058,
    EUR: 0.00053,
    GBP: 0.00045,
    ZAR: 0.0105,
    NGN: 0.87,
    KES: 0.075,
    TZS: 1.45,
    ZMW: 0.012,
    ZWL: 0.0018,
  };
  return rates[currency] || 1;
}
