import { COUNTRY_CURRENCY_MAP, DEFAULT_CURRENCY } from '@/lib/geo-config';

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

export function formatCurrencyAmount(amount: number, currency: CurrencyCode): string {
  const info = CURRENCY_INFO[currency];
  if (!info) {
    return `${amount.toLocaleString()} ${currency}`;
  }
  
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: info.decimalPlaces,
    minimumFractionDigits: info.decimalPlaces === 0 ? 0 : 2,
  }).format(amount);
}

export { COUNTRY_CURRENCY_MAP, DEFAULT_CURRENCY };

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
