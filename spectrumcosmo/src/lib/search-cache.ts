// lib/search-cache.ts
interface CacheEntry {
  results: any[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function getCachedSearch(query: string): any[] | null {
  const entry = cache.get(query.toLowerCase());
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(query.toLowerCase());
    return null;
  }
  
  return entry.results;
}

export function setCachedSearch(query: string, results: any[]): void {
  cache.set(query.toLowerCase(), {
    results,
    timestamp: Date.now(),
  });
}

export function clearSearchCache(): void {
  cache.clear();
}
