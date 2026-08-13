/**
 * Ultra-Fast In-Memory TTL Cache Layer
 * Provides sub-millisecond data retrieval for high-velocity API reads.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private static instance: MemoryCache | null = null;
  private cache = new Map<string, CacheEntry<any>>();

  private constructor() {
    // Periodic cleanup of expired entries every 30 seconds
    setInterval(() => this.cleanupExpired(), 30000);
  }

  public static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  /**
   * Get cached item if valid, else returns null
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set cached item with TTL in milliseconds (default: 10,000ms = 10s)
   */
  public set<T>(key: string, value: T, ttlMs = 10000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate specific key or keys starting with a prefix
   */
  public invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  public clear(): void {
    this.cache.clear();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = MemoryCache.getInstance();
