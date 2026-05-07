'use client';

import { formatCurrencyAmount } from '@/lib/currency';
import { useCurrency } from '@/components/storefront/CurrencyProvider';

interface CurrencyPriceProps {
  amountUsd: number;  // This is actually MWK (base currency) - keeping prop name for compatibility
  className?: string;
}

export default function CurrencyPrice({ amountUsd, className = '' }: CurrencyPriceProps) {
  const { currency, rates } = useCurrency();
  
  // The amount passed is now MWK (base currency)
  const amountMwk = amountUsd;
  
  // If currency is MWK, no conversion needed
  if (currency === 'MWK') {
    return <span className={className}>MWK {amountMwk.toLocaleString()}</span>;
  }
  
  // Convert MWK to selected currency
  // rates[currency] should be value in that currency per 1 MWK
  const rate = rates[currency] ?? 1;
  const convertedAmount = amountMwk * rate;
  
  return (
    <span className={className}>
      {formatCurrencyAmount(convertedAmount, currency)}
    </span>
  );
}
