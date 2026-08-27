import { Preferences } from '@capacitor/preferences';

export const CACHE_KEYS = {
  PRODUCTS: 'cached_products',
  CATEGORIES: 'cached_categories',
  PRODUCTS_TIMESTAMP: 'products_timestamp',
};

export interface CachedData<T> {
  data: T;
  timestamp: number;
  version: string;
}

export class StorageService {
  private static instance: StorageService;
  private isNative: boolean;

  private constructor() {
    this.isNative = typeof window !== 'undefined' && !!(window as any).Capacitor;
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const data: CachedData<T> = {
        data: value,
        timestamp: Date.now(),
        version: '1.0.0',
      };
      const serialized = JSON.stringify(data);
      
      if (this.isNative) {
        await Preferences.set({ key, value: serialized });
      } else {
        localStorage.setItem(key, serialized);
      }
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      let serialized: string | null = null;
      
      if (this.isNative) {
        const result = await Preferences.get({ key });
        serialized = result.value;
      } else {
        serialized = localStorage.getItem(key);
      }

      if (!serialized) return null;
      const data: CachedData<T> = JSON.parse(serialized);
      return data.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  async getWithTimestamp<T>(key: string): Promise<CachedData<T> | null> {
    try {
      let serialized: string | null = null;
      
      if (this.isNative) {
        const result = await Preferences.get({ key });
        serialized = result.value;
      } else {
        serialized = localStorage.getItem(key);
      }

      if (!serialized) return null;
      return JSON.parse(serialized);
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      if (this.isNative) {
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Failed to remove cached data:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.isNative) {
        await Preferences.clear();
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  isStale(timestamp: number, maxAgeMinutes: number = 5): boolean {
    const age = Date.now() - timestamp;
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    return age > maxAgeMs;
  }

  isExpired(timestamp: number, maxAgeHours: number = 24): boolean {
    const age = Date.now() - timestamp;
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    return age > maxAgeMs;
  }
}

export const storage = StorageService.getInstance();
