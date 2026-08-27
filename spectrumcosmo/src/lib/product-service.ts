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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export class ProductService {
  private static instance: ProductService;
  private isNative: boolean;

  private constructor() {
    this.isNative = typeof window !== 'undefined' && !!(window as any).Capacitor;
  }

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  async fetchProducts(params?: { category?: string; search?: string }): Promise<Product[]> {
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
      await storage.set(CACHE_KEYS.PRODUCTS, data);
      await storage.set(CACHE_KEYS.PRODUCTS_TIMESTAMP, Date.now());

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

  async getCachedProducts(): Promise<Product[] | null> {
    return await storage.get<Product[]>(CACHE_KEYS.PRODUCTS);
  }

  async getCachedCategories(): Promise<Category[] | null> {
    return await storage.get<Category[]>(CACHE_KEYS.CATEGORIES);
  }

  async getProductsWithCache(params?: {
    category?: string;
    search?: string;
  }): Promise<{ data: Product[]; fromCache: boolean }> {
    try {
      const cached = await this.getCachedProducts();
      const timestamp = await storage.get<number>(CACHE_KEYS.PRODUCTS_TIMESTAMP);

      if (cached && timestamp) {
        const isExpired = storage.isExpired(timestamp, 24);

        if (!isExpired) {
          // Show cache immediately, refresh in background on native
          if (this.isNative) {
            this.fetchProductsInBackground(params);
          }
          return { data: cached, fromCache: true };
        }
      }

      // No cache or expired — fetch fresh
      const freshData = await this.fetchProducts(params);
      return { data: freshData, fromCache: false };
    } catch (error) {
      console.error('Failed to get products:', error);

      // Network failed — fall back to cache if available
      const cached = await this.getCachedProducts();
      if (cached) {
        console.warn('Network unavailable, serving from cache');
        return { data: cached, fromCache: true };
      }

      throw error;
    }
  }

  private async fetchProductsInBackground(
    params?: { category?: string; search?: string }
  ): Promise<void> {
    try {
      await this.fetchProducts(params);
    } catch (error) {
      console.warn('Background refresh failed:', error);
    }
  }

  async refreshProducts(params?: { category?: string; search?: string }): Promise<Product[]> {
    return await this.fetchProducts(params);
  }

  async clearCache(): Promise<void> {
    await storage.remove(CACHE_KEYS.PRODUCTS);
    await storage.remove(CACHE_KEYS.CATEGORIES);
    await storage.remove(CACHE_KEYS.PRODUCTS_TIMESTAMP);
  }
}

export const productService = ProductService.getInstance();
