import { Injectable, Inject, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Interface for cache configuration options.
 */
export interface CacheConfig {
  /** Time-to-live for cache entries in seconds. */
  ttl?: number;
  /** Prefix for cache keys. */
  prefix?: string;
}

/**
 * Service for interacting with the cache manager.
 */
@Injectable()
export class CacheService {
  /**
   * Initializes CacheService, optionally disabling key prefixing for the first store.
   */
  constructor(@Optional() @Inject(CACHE_MANAGER) private cacheManager: Cache) {
    if (this.cacheManager?.stores?.[0]) {
      this.cacheManager.stores[0].useKeyPrefix = false;
    }
  }

  /**
   * Retrieves a value from the cache.
   * @param key The cache key.
   * @returns The cached value or null if not found/error.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.cacheManager) return null;

    try {
      const result = await this.cacheManager.get<T>(key);
      return result ?? null;
    } catch (error) {
      console.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Sets a value in the cache.
   * @param key The cache key.
   * @param value The value to cache.
   * @param ttl Optional time-to-live in seconds.
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.cacheManager) return;

    try {
      // TTL is provided in seconds and converted to milliseconds for cache-manager
      await this.cacheManager.set(key, value, ttl ? ttl * 1000 : undefined);
    } catch (error) {
      console.error(`Cache set error: ${error.message}`);
    }
  }

  /**
   * Deletes cache entries matching a pattern.
   * Note: This implementation assumes a synchronous store with a `keys()` method (e.g., in-memory store).
   * For production, especially with Redis/external caches, consider more robust pattern deletion or specific invalidation strategies.
   * @param pattern The pattern to match cache keys for deletion.
   */
  async del(pattern: string): Promise<void> {
    if (!this.cacheManager) return;

    try {
      // Basic check if the store supports direct key listing
      if (
        !this.cacheManager.stores?.[0]?.store ||
        typeof this.cacheManager.stores[0].store.keys !== 'function'
      ) {
        console.warn(
          'Cache store does not support direct key listing for pattern deletion. Manual invalidation recommended for this cache type.',
        );
        return;
      }

      const keys = Array.from(
        this.cacheManager.stores[0].store.keys(),
      ) as string[];
      const matchingKeys = keys.filter((key) => key.startsWith(pattern));

      if (matchingKeys.length > 0) {
        await this.cacheManager.mdel(matchingKeys);
      }
    } catch (error) {
      console.error(`Cache delete error: ${error.message}`);
    }
  }
  /**
   * Deletes cache entries matching a pattern.
   * Note: This implementation assumes a synchronous store with a `keys()` method (e.g., in-memory store).
   * For production, especially with Redis/external caches, consider more robust pattern deletion or specific invalidation strategies.
   * @param pattern The pattern to match cache keys for deletion.
   */
  async mdel(...patterns: string[]): Promise<void> {
    if (!this.cacheManager) return;

    try {
      if (!patterns?.length) return;
      // Use Promise.allSettled to ensure all invalidations are attempted even if one fails
      await Promise.allSettled(
        patterns.map(async (key) => await this.del(key)), // Directly delete resolved keys
      );
    } catch (error) {
      console.error(`Cache delete error: ${error.message}`);
    }
  }

  /**
   * Generates a consistent cache key from a prefix and parts.
   * Converts complex parts (objects) to a base64 encoded string for a concise key.
   * @param prefix The base prefix for the key  like 'customer:all' for the customer list and "customer:147df52sdgsde85d258sdg8s8" for a single customer with id.
   * @param parts Additional parts to include in the key.
   * @returns The generated cache key.
   */
  generateKey(prefix: string, ...parts: any[]): string {
    if (!parts.length) return prefix;

    const hash = parts
      .map((p) => (typeof p === 'object' ? JSON.stringify(p) : String(p)))
      .join(':');

    return `${prefix}:${hash}`;
  }
}
