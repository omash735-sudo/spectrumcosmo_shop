'use client'

import { CURRENCY_LABELS, type CurrencyCode } from '@/lib/currency'
import { useCurrency } from '@/components/storefront/CurrencyProvider'

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()

  return (
    <select
      aria-label="Select currency"
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:border-[#F97316] focus:ring-2 focus:ring-orange-100 outline-none"
    >
      {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
        <option key={code} value={code}>
          {code} - {label}
        </option>
      ))}
    </select>
  )
}

