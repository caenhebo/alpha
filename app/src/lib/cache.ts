// Simple in-memory cache for API responses
// This provides instant responses for frequently accessed data

interface CacheEntry {
  data: any;
  timestamp: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 60000; // 1 minute default

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Auto-expire after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl || this.defaultTTL);
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear cache entries for a specific user
  clearUserCache(userId: string): void {
    for (const [key] of this.cache) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const apiCache = new SimpleCache();

// Cache key generators
export const cacheKeys = {
  userSession: (userId: string) => `session:${userId}`,
  userKyc: (userId: string) => `kyc:${userId}`,
  userWallets: (userId: string) => `wallets:${userId}`,
  properties: (filters?: string) => `properties:${filters || 'all'}`,
  property: (id: string) => `property:${id}`,
  notifications: (userId: string) => `notifications:${userId}`,
  notificationCount: (userId: string) => `notifications:count:${userId}`,
};

// Helper to cache API responses
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = apiCache.get(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return fetcher().then(data => {
    apiCache.set(key, data, ttl);
    return data;
  });
}