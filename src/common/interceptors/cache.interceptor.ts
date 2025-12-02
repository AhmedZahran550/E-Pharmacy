import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  CACHE_INVALIDATE_METADATA,
  CACHE_OPTION_METADATA,
  CacheOptions,
} from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Optional()
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {
    if (this.cacheManager?.stores?.[0]) {
      this.cacheManager.stores[0].useKeyPrefix = false;
    }
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    if (!this.cacheManager) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const disabledCache = request?.query?.disableCache ?? false;
    // --- Handle Disabled Cache by request query paramter ---
    if (disabledCache) {
      return next.handle();
    }
    // --- Handle Cache Eviction ---
    const invalidateKeysMetadata = this.reflector.get<string[]>(
      CACHE_INVALIDATE_METADATA,
      handler,
    );

    if (invalidateKeysMetadata || request.method !== 'GET') {
      if (invalidateKeysMetadata) {
        // If CacheEvict is present, always proceed with the original handler first,
        // then invalidate the cache based on dynamic keys.
        return next.handle().pipe(
          tap(async () => {
            const resolvedInvalidateKeys = invalidateKeysMetadata.map(
              (keyPattern) => this.resolveKeyWithParams(keyPattern, request),
            );
            await this.invalidateCache(resolvedInvalidateKeys);
          }),
        );
      }
      return next.handle();
    }

    // --- Handle Cacheable (GET requests) ---
    const cacheOptions = this.reflector.get<CacheOptions>(
      CACHE_OPTION_METADATA,
      handler,
    );

    if (!cacheOptions?.key) {
      return next.handle();
    }

    // Resolve the cache key using request parameters and query
    const finalCacheKey = this.resolveKeyWithParams(cacheOptions.key, request);
    try {
      const cachedResult = await this.cacheManager.get(finalCacheKey);
      if (cachedResult !== undefined && cachedResult !== null) {
        return of(cachedResult); // Return cached result
      }
    } catch (error) {
      console.error(
        `Cache get error for key "${finalCacheKey}": ${error.message}`,
      );
    }

    // If not cached, proceed with the original handler and then cache the result
    return next.handle().pipe(
      tap(async (result) => {
        if (result === undefined || result === null) {
          return; // Don't cache undefined/null results
        }
        try {
          // TTL is in seconds in decorator, convert to milliseconds for cache-manager
          await this.cacheManager.set(
            finalCacheKey,
            result,
            cacheOptions.ttl ? cacheOptions.ttl * 1000 : undefined,
          );
        } catch (error) {
          console.error(
            `Cache set error for key "${finalCacheKey}": ${error.message}`,
          );
        }
      }),
    );
  }

  /**
   * Resolves a cache key pattern by replacing placeholders with actual request parameters.
   * E.g., 'customer:{{id}}' becomes 'customer:123' if request.params.id is '123'.
   * @param keyPattern The key string which might contain placeholders like `{{paramName}}`.
   * @param request The NestJS request object containing params and query.
   * @returns The resolved cache key.
   */
  private resolveKeyWithParams(keyPattern: string, request: any): string {
    // Replace {{paramName}} with actual values from request.params
    let resolvedKey = keyPattern.replace(
      /\{\{(\w+)\}\}/g,
      (match, paramName) => {
        const paramValue = request.params?.[paramName];
        if (paramValue === undefined) {
          throw new Error('Paramter in cache key not found in request.params');
        }
        return String(paramValue); // Use original placeholder if param not found
      },
    );
    // Add query parameters to the key if present and not already part of the resolved key
    const queryParams = request.query;
    if (queryParams && Object.keys(queryParams).length > 0) {
      // Sort keys for consistent hashing
      const sortedQueryParams = Object.keys(queryParams)
        .sort()
        .map((key) => `${key}=${queryParams[key]}`)
        .join('&');
      resolvedKey += `?${sortedQueryParams}`;
    }

    // Example: For 'customer:{{id}}' and query params, it might become 'customer:123?page=1&limit=10'
    // Or you can hash query/params separately and append for a shorter key, similar to generateKey in CacheService
    // For now, simple append for queries.
    return resolvedKey;
  }

  private async invalidateCache(keysToInvalidate: string[]): Promise<void> {
    if (!keysToInvalidate?.length) return;

    // Use Promise.allSettled to ensure all invalidations are attempted even if one fails
    await Promise.allSettled(
      keysToInvalidate.map((key) => this.invalidatePattern(key)), // Directly delete resolved keys
    );
  }

  private async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (!this.cacheManager.stores?.[0]?.store) return;

      const keys = Array.from(
        this.cacheManager.stores[0].store.keys(),
      ) as string[];
      const matchingKeys = keys.filter((key) => key.startsWith(pattern));

      if (matchingKeys.length > 0) {
        await this.cacheManager.mdel(matchingKeys);
      }
    } catch (error) {
      console.error(`Cache invalidation error: ${error.message}`);
    }
  }
}
