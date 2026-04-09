export type CurrencyCode = 'USD' | 'MWK' | 'ZAR' | 'EUR'

export const CURRENCY_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  MWK: 1750,
  ZAR: 18.5,
  EUR: 0.92,
}

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  USD: 'US Dollar',
  MWK: 'Malawian Kwacha',
  ZAR: 'South African Rand',
  EUR: 'Euro',
}

export function convertUsdAmount(amountInUsd: number, toCurrency: CurrencyCode): number {
  return amountInUsd * CURRENCY_RATES[toCurrency]
}

export function formatCurrencyAmount(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'MWK' ? 0 : 2,
  }).format(amount)
}

