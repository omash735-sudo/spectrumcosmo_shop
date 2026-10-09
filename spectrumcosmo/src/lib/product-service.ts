import { storage, CACHE_KEYS } from './storage';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  currency: string;
  image_url: string | null;
  category_id: string | null;
  status: string;
  stock_quantity: number;
  is_featured: boolean;
  sku: string | null;
  created_at: Date;
  category_name?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
}

type ProductQuery = { category?: string; search?: string };

// One cached result set for one specific query (category + search).
interface ProductCacheEntry {
  data: Product[];
  fetchedAt: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const CACHE_TTL_HOURS = 24;

// Each distinct query gets its own cache entry, so search terms could
// otherwise pile up forever. Keep only the most recently written ones.
const MAX_CACHED_QUERIES = 20;

// Ordered list (oldest first) of the per-query cache keys currently
// stored. Needed because clearCache() and eviction must know which keys
// exist, and the storage API is key-by-key.
const PRODUCTS_INDEX_KEY = `${CACHE_KEYS.PRODUCTS}::index`;

export class ProductService {
  private static instance: ProductService;
  private isNative: boolean;

  // Serialises read-modify-write updates of the key index so two
  // overlapping fetches cannot drop each other's entry.
  private indexQueue: Promise<void> = Promise.resolve();

  private constructor() {
    // `window.Capacitor` exists in normal browsers too once @capacitor/core
    // is imported anywhere, so its presence does not mean "inside the app".
    // isNativePlatform() is true only in the Android/iOS app.
    this.isNative =
      typeof window !== 'undefined' &&
      (window as any).Capacitor?.isNativePlatform?.() === true;
  }

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  // ---------------------------------------------------------------
  // Query-aware cache helpers
  // ---------------------------------------------------------------

  // The key is built from exactly what is sent to the API (category
  // unless it is "All", plus the search text), so two requests share a
  // cache entry only if the server would receive the same query.
  private cacheKeyFor(params?: ProductQuery): string {
    const category =
      params?.category && params.category !== 'All' ? params.category : '';
    const search = params?.search ?? '';
    return `${CACHE_KEYS.PRODUCTS}::c=${encodeURIComponent(category)}::q=${encodeURIComponent(search)}`;
  }

  private enqueueIndexUpdate<T>(op: () => Promise<T>): Promise<T> {
    const run = this.indexQueue.then(op, op);
    this.indexQueue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private async readEntry(params?: ProductQuery): Promise<ProductCacheEntry | null> {
    try {
      const entry = await storage.get<ProductCacheEntry>(this.cacheKeyFor(params));
      if (entry && Array.isArray(entry.data) && typeof entry.fetchedAt === 'number') {
        return entry;
      }
      return null;
    } catch (error) {
      console.warn('Failed to read product cache:', error);
      return null;
    }
  }

  // Best-effort: a storage problem must never throw away data that was
  // fetched successfully from the network.
  private async writeEntry(params: ProductQuery | undefined, data: Product[]): Promise<void> {
    const key = this.cacheKeyFor(params);
    try {
      const entry: ProductCacheEntry = { data, fetchedAt: Date.now() };
      await storage.set(key, entry);

      await this.enqueueIndexUpdate(async () => {
        const stored = await storage.get<string[]>(PRODUCTS_INDEX_KEY);
        const index = Array.isArray(stored) ? stored : [];
        const next = [...index.filter((k) => k !== key), key];
        const evicted =
          next.length > MAX_CACHED_QUERIES
            ? next.splice(0, next.length - MAX_CACHED_QUERIES)
            : [];
        await storage.set(PRODUCTS_INDEX_KEY, next);
        await Promise.all(evicted.map((k) => storage.remove(k)));
      });
    } catch (error) {
      console.warn('Failed to write product cache:', error);
    }
  }

  // ---------------------------------------------------------------
  // Network
  // ---------------------------------------------------------------

  async fetchProducts(params?: ProductQuery): Promise<Product[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category && params.category !== 'All') {
        queryParams.append('category', params.category);
      }
      if (params?.search) {
        queryParams.append('q', params.search);
      }

      const path = `/api/public/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(`${API_BASE}${path}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      await this.writeEntry(params, data);

      return data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  async fetchCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE}/api/public/categories`);

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      await storage.set(CACHE_KEYS.CATEGORIES, data);

      return data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  }

  // With no params this returns the cached unfiltered ("All products")
  // list. Pass the same params used for the request to get that query's
  // cached results.
  async getCachedProducts(params?: ProductQuery): Promise<Product[] | null> {
    const entry = await this.readEntry(params);
    return entry ? entry.data : null;
  }

  async getCachedCategories(): Promise<Category[] | null> {
    return await storage.get<Category[]>(CACHE_KEYS.CATEGORIES);
  }

  async getProductsWithCache(params?: ProductQuery): Promise<{ data: Product[]; fromCache: boolean }> {
    try {
      const entry = await this.readEntry(params);

      if (entry && !storage.isExpired(entry.fetchedAt, CACHE_TTL_HOURS)) {
        // Show cache immediately, refresh in background on native
        if (this.isNative) {
          this.fetchProductsInBackground(params);
        }
        return { data: entry.data, fromCache: true };
      }

      // No cache for THIS query, or it expired — fetch fresh
      const freshData = await this.fetchProducts(params);
      return { data: freshData, fromCache: false };
    } catch (error) {
      console.error('Failed to get products:', error);

      // Network failed — fall back to cache for THIS query only (expired
      // is fine here). Never serve another query's results.
      const entry = await this.readEntry(params);
      if (entry) {
        console.warn('Network unavailable, serving from cache');
        return { data: entry.data, fromCache: true };
      }

      throw error;
    }
  }

  private async fetchProductsInBackground(params?: ProductQuery): Promise<void> {
    try {
      await this.fetchProducts(params);
    } catch (error) {
      console.warn('Background refresh failed:', error);
    }
  }

  async refreshProducts(params?: ProductQuery): Promise<Product[]> {
    return await this.fetchProducts(params);
  }

  async clearCache(): Promise<void> {
    await this.enqueueIndexUpdate(async () => {
      const stored = await storage.get<string[]>(PRODUCTS_INDEX_KEY);
      const keys = Array.isArray(stored) ? stored : [];
      await Promise.all(keys.map((k) => storage.remove(k)));
      await storage.remove(PRODUCTS_INDEX_KEY);
    });

    // Legacy single-key entries written by the previous version.
    await storage.remove(CACHE_KEYS.PRODUCTS);
    await storage.remove(CACHE_KEYS.PRODUCTS_TIMESTAMP);
    await storage.remove(CACHE_KEYS.CATEGORIES);
  }
}

export const productService = ProductService.getInstance();
