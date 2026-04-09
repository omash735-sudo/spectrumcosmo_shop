'use client'

import { convertUsdAmount, formatCurrencyAmount } from '@/lib/currency'
import { useCurrency } from '@/components/storefront/CurrencyProvider'

export default function CurrencyPrice({ amountUsd }: { amountUsd: number }) {
  const { currency, rates } = useCurrency()
  const convertedAmount = amountUsd * (rates[currency] ?? convertUsdAmount(1, currency))

  return <>{formatCurrencyAmount(convertedAmount, currency)}</>
}

