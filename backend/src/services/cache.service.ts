// Cache Service
// In-memory cache implementation with TTL for API response caching

import { logger } from '../utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    this.startCleanupInterval();
  }

  /**
   * Set a value in the cache with TTL (in seconds)
   */
  public set<T>(key: string, data: T, ttlSeconds: number = 3600): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000 // Convert to milliseconds
    };

    this.cache.set(key, entry);
    logger.debug('Cache set', { key, ttl: ttlSeconds });
  }

  /**
   * Get a value from the cache
   * Returns null if not found or expired
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug('Cache miss', { key });
      return null;
    }

    // Check if expired
    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      // Expired - remove from cache
      this.cache.delete(key);
      logger.debug('Cache expired', { key, age: age / 1000 });
      return null;
    }

    logger.debug('Cache hit', { key, age: age / 1000 });
    return entry.data as T;
  }

  /**
   * Check if a key exists and is not expired
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key from cache
   */
  public delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache delete', { key });
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    keys: string[];
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const keys = Array.from(this.cache.keys());
    const timestamps = Array.from(this.cache.values()).map(entry => entry.timestamp);

    return {
      size: this.cache.size,
      keys,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }

  /**
   * Generate cache key for PhytoSense data requests
   */
  public generatePhytoSenseKey(
    tdid: number,
    params: any,
    aggregation: string
  ): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return `phytosense:${tdid}:${aggregation}:${paramString}`;
  }

  /**
   * Calculate TTL based on data characteristics
   * Historical data can be cached longer than recent data
   */
  public calculateTTL(startDate: Date, endDate: Date): number {
    const now = new Date();
    const daysSinceEnd = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24);

    // If end date is more than 7 days ago, it's historical data - cache for 24 hours
    if (daysSinceEnd > 7) {
      return 86400; // 24 hours
    }

    // If end date is more than 24 hours ago - cache for 1 hour
    if (daysSinceEnd > 1) {
      return 3600; // 1 hour
    }

    // Recent data - cache for 5 minutes
    return 300; // 5 minutes
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info('Cache cleanup completed', {
        entriesRemoved: removed,
        remainingEntries: this.cache.size
      });
    }
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    logger.info('Cache service destroyed');
  }
}

// Export singleton instance
export const cacheService = new CacheService();
