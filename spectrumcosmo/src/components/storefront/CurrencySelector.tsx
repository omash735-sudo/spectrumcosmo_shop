'use client'

import { CURRENCY_LABELS, type CurrencyCode } from '@/lib/currency'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import { ChevronDown, Globe } from 'lucide-react'
import { useState } from 'react'

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Desktop Dropdown */}
      <div className="hidden sm:block">
        <select
          aria-label="Select currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
          className="h-10 rounded-xl border border-[var(--border)] bg-[var(--background-card)] px-3 pr-8 text-sm font-medium text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none appearance-none cursor-pointer min-w-[100px]"
        >
          {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {code} - {label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] pointer-events-none" />
      </div>

      {/* Mobile Dropdown - Custom styled for better touch */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background-card)] text-sm font-medium text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none min-w-[70px]"
        >
          <Globe size={16} className="text-[var(--foreground-muted)]" />
          <span>{currency}</span>
          <ChevronDown size={14} className="text-[var(--foreground-muted)]" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-lg overflow-hidden min-w-[160px]">
              {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => handleSelect(code as CurrencyCode)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition min-h-[44px] ${
                    currency === code
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                      : 'text-[var(--foreground)] hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  <span className="font-medium">{code}</span>
                  <span className="text-[var(--foreground-muted)] ml-2 text-xs">{label}</span>
                  {currency === code && (
                    <span className="float-right text-[var(--primary)]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
