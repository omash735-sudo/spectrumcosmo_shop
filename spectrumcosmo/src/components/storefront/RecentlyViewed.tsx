'use client';

import { useEffect, useState } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Trash2 } from 'lucide-react';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';

interface FeatureSettings {
  recentlyViewed: {
    enabled: boolean;
    maxItems: number;
    title: string;
    showClearButton: boolean;
  };
}

export default function RecentlyViewed() {
  const { recent, isLoaded } = useRecentlyViewed();
  const [settings, setSettings] = useState<FeatureSettings | null>(null);

  useEffect(() => {
    fetch('/api/homepage/features')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
  }, []);

  if (!isLoaded || !settings?.recentlyViewed.enabled || recent.length === 0) return null;

  const { maxItems, title, showClearButton } = settings.recentlyViewed;
  const displayItems = recent.slice(0, maxItems);

  return (
    <section className="mt-12 sm:mt-16 mb-6 sm:mb-8">
      <div className="flex justify-between items-center mb-4 sm:mb-5">
        <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
          <Clock size={18} className="text-[#F97316] sm:w-[20px] sm:h-[20px] md:w-[22px] md:h-[22px]" />
          {title}
        </h2>
        {showClearButton && (
          <button
            onClick={() => {
              if (confirm('Clear your recently viewed items?')) {
                localStorage.removeItem('spectrumcosmo_recently_viewed');
                window.location.reload();
              }
            }}
            className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 transition px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 size={10} className="sm:w-3 sm:h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:overflow-visible">
        {displayItems.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="flex-shrink-0 w-32 sm:w-auto group"
          >
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  sizes="(max-width: 640px) 128px, 160px"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs">
                  No image
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1.5 sm:mt-2 line-clamp-2 group-hover:text-[#F97316] transition">
              {product.name}
            </p>
            <p className="text-sm sm:text-base font-bold text-[#F97316] dark:text-orange-500 mt-0.5 sm:mt-1">
              <CurrencyPrice amountUsd={product.price} />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
