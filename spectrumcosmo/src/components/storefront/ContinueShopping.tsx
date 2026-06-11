'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { getLastCategory, saveLastCategory, clearLastCategory } from '@/lib/recentlyViewedUtils';

export default function ContinueShopping() {
  const [lastCategory, setLastCategory] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const data = getLastCategory();
    if (data && data.category !== 'All') {
      setLastCategory(data.category);
      setIsVisible(true);
    }
  }, []);

  if (!isVisible || !lastCategory) return null;

  const handleDismiss = () => {
    clearLastCategory();
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-24 z-40 md:left-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 dark:bg-orange-950/30 p-2 rounded-full">
            <ShoppingBag size={16} className="text-[#F97316]" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-200">Continue Shopping</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">in {lastCategory}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/products?category=${encodeURIComponent(lastCategory)}`}
            className="bg-[#F97316] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-orange-600 transition flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            Continue
          </Link>
          <button
            onClick={handleDismiss}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm px-2"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
