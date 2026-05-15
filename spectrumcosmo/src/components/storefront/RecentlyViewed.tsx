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
    <section className="mt-16 mb-8">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
          <Clock size={22} className="text-[#F97316]" />
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
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:overflow-visible">
        {displayItems.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="flex-shrink-0 w-36 sm:w-auto group"
          >
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  sizes="(max-width: 640px) 144px, 160px"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                  No image
                </div>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-800 mt-2 line-clamp-2 group-hover:text-[#F97316] transition">
              {product.name}
            </p>
            <p className="text-base font-bold text-[#F97316] mt-1">
              <CurrencyPrice amountUsd={product.price} />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
