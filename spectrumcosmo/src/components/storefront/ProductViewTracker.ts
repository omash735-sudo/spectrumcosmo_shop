'use client';

import { useEffect } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

interface ProductViewTrackerProps {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
}

export default function ProductViewTracker({ product }: ProductViewTrackerProps) {
  const { addProduct } = useRecentlyViewed();

  useEffect(() => {
    if (product) {
      addProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
      });
    }
  }, [product, addProduct]);

  return null;
}
