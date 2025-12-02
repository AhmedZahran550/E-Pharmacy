import { SetMetadata } from '@nestjs/common';
/**
 * Metadata key used to store cache options on a method.
 * This key identifies the configuration for cacheable methods.
 */
export const CACHE_OPTION_METADATA = 'cache_option';

/**
 * Metadata key used to store keys for cache invalidation on a method.
 * This key identifies which cache entries should be removed.
 */
export const CACHE_INVALIDATE_METADATA = 'cache_invalidate';

/**
 * Interface defining the options for a cacheable operation.
 * These options determine how a method's result should be cached.
 */
export interface CacheOptions {
  /**
   * The unique key under which the result of the decorated method will be stored in the cache.
   * This key is crucial for identifying and retrieving cached data.
   *
   * For dynamic keys based on route parameters (e.g., `:id`), use `{{paramName}}` placeholders.
   * The `CacheInterceptor` will automatically resolve these placeholders from `request.params`.
   * For example, `key: 'user:{{id}}'` will become `user:123` if `id` in route params is `123`.
   */
  key: string;
  /**
   * The time-to-live (TTL) for the cached entry, in **seconds**.
   * After this duration, the cached entry will expire and be re-generated on the next request.
   * If not provided, a default TTL configured in the caching module will be used.
   */
  ttl?: number;
}

/**
 * Decorator that marks a method's return value as cacheable.
 * When a method decorated with `@Cacheable` is called, its result will be stored in the cache
 * under the specified `key`. Subsequent calls with the same key will retrieve the cached value
 * instead of re-executing the method, improving performance.
 *
 * This decorator supports dynamic keys using `{{paramName}}` placeholders, which are resolved
 * from route parameters by the `CacheInterceptor`. Query parameters are automatically appended
 * to the resolved key by the interceptor for further differentiation.
 *
 * @param options The caching options, including the cache `key` and an optional `ttl`.
 * @returns A method decorator that applies the caching metadata.
 *
 * @example
 * // Caching all users for 60 seconds
 * class MyService {
 * @Cacheable({ key: 'users:all', ttl: 60 })
 * findAllUsers(): User[] {
 * // This method's result will be cached
 * }
 *
 * // Caching a single user by ID, using a dynamic key from route params
 * // Assumes the route parameter is named 'id' (e.g., /users/:id)
 * @Cacheable({ key: 'user:{{id}}', ttl: 300 }) // Cache for 5 minutes
 * findOneUser(@Param('id') id: string): User {
 * // ... fetch single user ...
 * }
 *
 * // Example with multiple dynamic parameters (e.g., /books/:authorId/pages/:pageId)
 * @Cacheable({ key: 'book:{{authorId}}:page:{{pageId}}' })
 * findBookPage(@Param('authorId') authorId: string, @Param('pageId') pageId: string): Page {
 * // ...
 * }
 * }
 */
export const Cacheable = (options: CacheOptions) => {
  return SetMetadata(CACHE_OPTION_METADATA, options);
};

/**
 * Decorator that triggers cache invalidation for one or more specified keys.
 * When a method decorated with `@CacheEvict` is called, the cache entries
 * corresponding to the provided `keys` will be removed. This is typically used
 * after operations that modify data (e.g., create, update, delete) to ensure
 * that stale data is not served from the cache.
 *
 * This decorator also supports dynamic keys using `{{paramName}}` placeholders,
 * which are resolved from route parameters by the `CacheInterceptor`.
 *
 * @param keys A variadic list of strings representing the cache keys to invalidate.
 * These keys should match the keys used in `@Cacheable` decorators, including dynamic placeholders.
 * @returns A method decorator that applies the cache invalidation metadata.
 *
 * @example
 * class MyService {
 * // Invalidate the 'users:all' cache after creating a user
 * @CacheEvict('users:all')
 * createUser(newUser: User): User {
 * // ... logic to create user ...
 * }
 *
 * // Invalidate a specific user's cache by ID and the 'users:all' list after update
 * // Assumes the route parameter is named 'id' (e.g., /users/:id)
 * @CacheEvict('user:{{id}}', 'users:all')
 * updateUser(@Param('id') id: string, updatedUser: User): User {
 * // ... logic to update user ...
 * }
 *
 * // Invalidate a specific user's cache by ID and the 'users:all' list after deletion
 * @CacheEvict('user:{{id}}', 'users:all')
 * deleteUser(@Param('id') id: string) {
 * // ... logic to delete user ...
 * }
 * }
 */
export const CacheEvict = (...keys: string[]) => {
  return SetMetadata(CACHE_INVALIDATE_METADATA, keys);
};
