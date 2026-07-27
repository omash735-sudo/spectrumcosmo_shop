// components/storefront/CurrencySelector.tsx
'use client';

import { CURRENCY_INFO, type CurrencyCode } from '@/lib/currency';
import { useCurrency } from '@/components/storefront/CurrencyProvider';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function CurrencySelector() {
  const { currency, setCurrency, isAutoDetected } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code);
    setIsOpen(false);
  };

  const currentCurrencyInfo = CURRENCY_INFO[currency];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--background-card)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none min-w-[80px]"
      >
        <span>{currentCurrencyInfo?.flag || '🌍'}</span>
        <span>{currency}</span>
        {isAutoDetected && (
          <span className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-1.5 py-0.5 rounded-full font-medium">
            Auto
          </span>
        )}
        <ChevronDown 
          size={14} 
          className={`text-[var(--foreground-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-lg overflow-hidden min-w-[200px] max-h-[300px] overflow-y-auto">
          {Object.entries(CURRENCY_INFO).map(([code, info]) => (
            <button
              key={code}
              onClick={() => handleSelect(code as CurrencyCode)}
              className={`w-full px-3.5 py-2.5 text-left text-sm transition flex items-center gap-2.5 min-h-[44px] ${
                currency === code
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                  : 'text-[var(--foreground)] hover:bg-[var(--background-secondary)]'
              }`}
            >
              <span className="text-base">{info.flag}</span>
              <span className="font-medium">{code}</span>
              <span className="text-[var(--foreground-muted)] text-xs ml-1">{info.label}</span>
              {currency === code && (
                <span className="ml-auto text-[var(--primary)]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
