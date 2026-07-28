// components/storefront/QuantitySelector.tsx
'use client';

import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  maxQuantity: number;
  isInStock: boolean;
}

export default function QuantitySelector({
  quantity,
  onIncrement,
  onDecrement,
  maxQuantity,
  isInStock,
}: QuantitySelectorProps) {
  return (
    <div className="mb-5 sm:mb-6">
      <p className="text-sm font-medium text-[var(--foreground)] mb-2 sm:mb-3">Quantity</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--background-card)]">
          <button
            onClick={onDecrement}
            disabled={quantity <= 1 || !isInStock}
            className="p-2 px-3 sm:px-4 hover:bg-[var(--background-secondary)] transition disabled:opacity-40 disabled:cursor-not-allowed text-[var(--foreground)]"
            aria-label="Decrease quantity"
          >
            <Minus size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <span className="w-10 sm:w-12 text-center text-sm font-medium text-[var(--foreground)]">
            {quantity}
          </span>
          <button
            onClick={onIncrement}
            disabled={quantity >= maxQuantity || !isInStock}
            className="p-2 px-3 sm:px-4 hover:bg-[var(--background-secondary)] transition disabled:opacity-40 disabled:cursor-not-allowed text-[var(--foreground)]"
            aria-label="Increase quantity"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
        <p className="text-xs text-[var(--foreground-muted)]">{maxQuantity} available</p>
      </div>
    </div>
  );
}
