// app/account/orders/components/OrderFilters.tsx
'use client';

import { Search } from 'lucide-react';
import { OrderStatus } from '@/lib/types/order';

interface OrderFiltersProps {
  filterStatus: OrderStatus | 'all';
  onFilterChange: (status: OrderStatus | 'all') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const statusOptions: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'pending_quote', label: 'Quote' },
  { value: 'awaiting_verification', label: 'Verifying' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrderFilters({
  filterStatus,
  onFilterChange,
  searchTerm,
  onSearchChange,
}: OrderFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-sm font-medium transition ${
              filterStatus === option.value
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--border)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative w-full sm:w-64">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
        <input
          type="text"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
        />
      </div>
    </div>
  );
}
