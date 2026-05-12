'use client';

import { useState, useEffect, useCallback } from 'react';

export interface RecentProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  slug?: string;
}

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('spectrumcosmo_recently_viewed');
    if (stored) {
      try {
        setRecent(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recently viewed:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const addProduct = useCallback((product: RecentProduct) => {
    setRecent((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 6);
      localStorage.setItem('spectrumcosmo_recently_viewed', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    localStorage.removeItem('spectrumcosmo_recently_viewed');
  }, []);

  return { recent, addProduct, clearRecent, isLoaded };
}
