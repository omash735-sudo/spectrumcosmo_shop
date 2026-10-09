import { useState, useEffect, useCallback, useRef } from 'react';
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

  // When the query (category/search) changes, drop everything that
  // belonged to the previous query IN THE SAME RENDER. Doing this during
  // render (React's "adjust state when a prop changes" pattern) instead of
  // in an effect means no frame is ever painted showing the old query's
  // products, `fromCache`, or error under the new query.
  const queryKey = JSON.stringify([initialCategory ?? '', initialSearch ?? '']);
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey);
  if (prevQueryKey !== queryKey) {
    setPrevQueryKey(queryKey);
    setProducts([]);
    setFromCache(false);
    setError(null);
    setRefreshing(false);
    setLoading(true);
  }

  // Every load/refresh takes a number; only the most recent one may write
  // state. A slower response for an earlier query can no longer overwrite
  // the results of the current one.
  const requestIdRef = useRef(0);

  const loadProducts = useCallback(async (category?: string, search?: string, refresh: boolean = false) => {
    const requestId = ++requestIdRef.current;
    const isLatest = () => requestId === requestIdRef.current;

    if (refresh) {
      setRefreshing(true);
      try {
        const freshData = await productService.refreshProducts({ category, search });
        if (!isLatest()) return;
        setProducts(freshData);
        setFromCache(false);
        // A successful retry must clear the error that triggered it,
        // otherwise the retry banner stays on screen after recovery.
        setError(null);
      } catch (err) {
        if (!isLatest()) return;
        setError(err instanceof Error ? err : new Error('Failed to load products'));
      } finally {
        // Guarded by isLatest so a superseded refresh cannot clear the
        // loading state of a newer request. When the query changes, the
        // render-phase reset already set refreshing to false.
        if (isLatest()) setRefreshing(false);
      }
      return;
    }

    try {
      const result = await productService.getProductsWithCache({ category, search });
      if (!isLatest()) return;
      setProducts(result.data);
      setFromCache(result.fromCache);
    } catch (err) {
      if (!isLatest()) return;
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

  useEffect(() => {
    // If the query changes (or the effect is re-run) while this init is
    // still in flight, only the newest run is allowed to end `loading`.
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadProducts(initialCategory, initialSearch),
        loadCategories(),
      ]);
      if (!cancelled) setLoading(false);
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [initialCategory, initialSearch, loadProducts, loadCategories]);

  return {
    products,
    categories,
    loading,
    refreshing,
    fromCache,
    error,
    refresh,
  };
}
