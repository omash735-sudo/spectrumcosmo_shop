// lib/currency.ts
export type CurrencyCode = 'USD' | 'MWK' | 'ZAR' | 'EUR' | 'NGN' | 'GBP' | 'KES' | 'TZS' | 'ZMW' | 'ZWL';

export const CURRENCY_INFO: Record<CurrencyCode, {
  symbol: string;
  label: string;
  locale: string;
  decimalPlaces: number;
  flag: string;
}> = {
  USD: { symbol: '$', label: 'US Dollar', locale: 'en-US', decimalPlaces: 2, flag: '🇺🇸' },
  MWK: { symbol: 'MK', label: 'Malawian Kwacha', locale: 'en-MW', decimalPlaces: 0, flag: '🇲🇼' },
  ZAR: { symbol: 'R', label: 'South African Rand', locale: 'en-ZA', decimalPlaces: 2, flag: '🇿🇦' },
  EUR: { symbol: '€', label: 'Euro', locale: 'en-EU', decimalPlaces: 2, flag: '🇪🇺' },
  NGN: { symbol: '₦', label: 'Nigerian Naira', locale: 'en-NG', decimalPlaces: 2, flag: '🇳🇬' },
  GBP: { symbol: '£', label: 'British Pound', locale: 'en-GB', decimalPlaces: 2, flag: '🇬🇧' },
  KES: { symbol: 'KSh', label: 'Kenyan Shilling', locale: 'en-KE', decimalPlaces: 2, flag: '🇰🇪' },
  TZS: { symbol: 'TSh', label: 'Tanzanian Shilling', locale: 'en-TZ', decimalPlaces: 0, flag: '🇹🇿' },
  ZMW: { symbol: 'ZK', label: 'Zambian Kwacha', locale: 'en-ZM', decimalPlaces: 2, flag: '🇿🇲' },
  ZWL: { symbol: '$', label: 'Zimbabwe Dollar', locale: 'en-ZW', decimalPlaces: 2, flag: '🇿🇼' },
};

export const COUNTRY_CURRENCY_MAP: Record<string, { currency: CurrencyCode; country: string }> = {
  MW: { currency: 'MWK', country: 'Malawi' },
  US: { currency: 'USD', country: 'United States' },
  ZA: { currency: 'ZAR', country: 'South Africa' },
  NG: { currency: 'NGN', country: 'Nigeria' },
  GB: { currency: 'GBP', country: 'United Kingdom' },
  KE: { currency: 'KES', country: 'Kenya' },
  TZ: { currency: 'TZS', country: 'Tanzania' },
  ZM: { currency: 'ZMW', country: 'Zambia' },
  ZW: { currency: 'ZWL', country: 'Zimbabwe' },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'MWK';

export function formatCurrencyAmount(amount: number, currency: CurrencyCode): string {
  const info = CURRENCY_INFO[currency];
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: info.decimalPlaces,
    minimumFractionDigits: info.decimalPlaces === 0 ? 0 : 2,
  }).format(amount);
}
