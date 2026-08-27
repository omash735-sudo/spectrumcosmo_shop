import { useState, useEffect, useCallback } from 'react';
import { productService } from '@/lib/product-service';
import { Product, Category } from '@/lib/product-service';

interface UseProductsResult {
  products: Product[];
  categories: Category[];
  loading: boolean;
  refreshing: boolean;
  fromCache: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useProductsWithCache(
  initialCategory?: string,
  initialSearch?: string
): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadProducts = useCallback(async (category?: string, search?: string, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        const freshData = await productService.refreshProducts({ category, search });
        setProducts(freshData);
        setFromCache(false);
        setRefreshing(false);
        return;
      }

      const result = await productService.getProductsWithCache({ category, search });
      setProducts(result.data);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load products'));
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const cached = await productService.getCachedCategories();
      if (cached) {
        setCategories(cached);
        return;
      }

      const fresh = await productService.fetchCategories();
      setCategories(fresh);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadProducts(initialCategory, initialSearch, true);
  }, [initialCategory, initialSearch, loadProducts]);

  const loadMore = useCallback(async () => {
    if (!hasMore || refreshing) return;
    setPage(prev => prev + 1);
  }, [hasMore, refreshing]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadProducts(initialCategory, initialSearch),
        loadCategories(),
      ]);
      setLoading(false);
    };

    init();
  }, [initialCategory, initialSearch, loadProducts, loadCategories]);

  return {
    products,
    categories,
    loading,
    refreshing,
    fromCache,
    error,
    refresh,
    loadMore,
  };
}
