// app/account/orders/components/EmptyOrders.tsx
'use client';

import Link from 'next/link';
import { Package, ShoppingBag, ArrowRight } from 'lucide-react';

interface EmptyOrdersProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export default function EmptyOrders({ hasFilters, onClearFilters }: EmptyOrdersProps) {
  return (
    <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-8 sm:p-12 text-center shadow-sm">
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
        <Package size={28} className="text-[var(--foreground-muted)]/50 sm:w-8 sm:h-8" />
      </div>
      <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-2">
        {hasFilters ? 'No orders match your filters' : 'No orders yet'}
      </h3>
      <p className="text-[var(--foreground-muted)] text-sm mb-5 sm:mb-6">
        {hasFilters 
          ? 'Try adjusting your search or filters' 
          : "You haven't placed any orders yet"}
      </p>
      {hasFilters ? (
        <button
          onClick={onClearFilters}
          className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium text-sm"
        >
          Clear filters →
        </button>
      ) : (
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium text-sm sm:text-base hover:bg-[var(--primary-hover)] transition"
        >
          Start Shopping <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
