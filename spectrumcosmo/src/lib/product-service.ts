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

      const url = `/api/public/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);
      
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
      const response = await fetch('/api/public/categories');
      
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

  async getProductsWithCache(params?: { category?: string; search?: string }): Promise<{ data: Product[]; fromCache: boolean }> {
    try {
      const cached = await this.getCachedProducts();
      const timestamp = await storage.get<number>(CACHE_KEYS.PRODUCTS_TIMESTAMP);
      
      if (cached && timestamp) {
        const isExpired = storage.isExpired(timestamp, 24);
        
        if (!isExpired) {
          if (this.isNative) {
            this.fetchProductsInBackground(params);
          }
          return { data: cached, fromCache: true };
        }
      }

      const freshData = await this.fetchProducts(params);
      return { data: freshData, fromCache: false };
    } catch (error) {
      console.error('Failed to get products:', error);
      
      const cached = await this.getCachedProducts();
      if (cached) {
        return { data: cached, fromCache: true };
      }
      
      throw error;
    }
  }

  private async fetchProductsInBackground(params?: { category?: string; search?: string }): Promise<void> {
    try {
      const freshData = await this.fetchProducts(params);
      await storage.set(CACHE_KEYS.PRODUCTS, freshData);
      await storage.set(CACHE_KEYS.PRODUCTS_TIMESTAMP, Date.now());
    } catch (error) {
      console.warn('Background refresh failed:', error);
    }
  }

  async refreshProducts(params?: { category?: string; search?: string }): Promise<Product[]> {
    const freshData = await this.fetchProducts(params);
    return freshData;
  }

  async clearCache(): Promise<void> {
    await storage.remove(CACHE_KEYS.PRODUCTS);
    await storage.remove(CACHE_KEYS.CATEGORIES);
    await storage.remove(CACHE_KEYS.PRODUCTS_TIMESTAMP);
  }
}

export const productService = ProductService.getInstance();
