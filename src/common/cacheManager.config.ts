// src/config/cache.config.ts
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

// This function will be used as the useFactory for CacheModule.registerAsync
export const cacheConfigFactory = async (
  configService: ConfigService,
): Promise<CacheModuleOptions> => {
  // Read cache type and default TTL from environment variables
  const cacheType = configService.get<string>('CACHE_STORE_TYPE') || 'memory'; // Default to 'memory'
  const ttl = configService.get<number>('CACHE_TTL') || 1000 * 60 * 60; // Default TTL in milliseconds (1 hour)

  const cacheConfig: CacheModuleOptions = {
    ttl: ttl, // Default TTL for cache items
  };

  console.log(`Attempting to configure cache store type: ${cacheType}`);

  if (cacheType === 'redis') {
    // Read Redis configuration from environment variables
    const redisHost = configService.get<string>('REDIS_HOST');
    const redisPort = configService.get<number>('REDIS_PORT');
    const redisPassword = configService.get<string>('REDIS_PASSWORD'); // Optional password
    const redisDb = configService.get<number>('REDIS_DB'); // Optional database index

    // Basic validation for required Redis variables
    if (!redisHost || redisPort === undefined || isNaN(redisPort)) {
      console.error(
        'REDIS_HOST and REDIS_PORT must be configured in environment variables when CACHE_STORE_TYPE is "redis".',
      );
    }

    // Configure Redis store options
    const redisOptions: any = {
      socket: {
        host: redisHost || 'localhost', // Default host if not provided (though validation above checks)
        port: redisPort || 6379, // Default port if not provided (though validation above checks)
      },
      ttl: ttl, // Use the configured TTL for Redis store
      // Add other cache-manager-redis-store specific options here
      // Example: enableOfflineQueue: false, // Recommended to prevent commands queueing when Redis is down
      // Example: connectTimeout: 10000, // Connection timeout in ms
      // Example: maxRetriesPerRequest: 1, // Limit connection retries
    };

    if (redisPassword) {
      redisOptions.password = redisPassword; // Use 'password' option for cache-manager-redis-store v2+
      // For older versions of cache-manager-redis-store, it might be 'auth_pass'
      // Check the documentation for the version you are using.
    }

    if (redisDb !== undefined && !isNaN(redisDb)) {
      redisOptions.db = redisDb; // Specify Redis database index
    }

    try {
      // Create the Redis store instance
      cacheConfig.store = (await redisStore(redisOptions)) as any; // Type assertion needed

      console.log(
        `Successfully configured Redis cache store: ${redisHost || 'localhost'}:${redisPort || 6379}, DB: ${redisDb || 0}`,
      );
    } catch (error) {
      console.error('Failed to configure Redis cache store:', error);
      throw error;
    }
  } else {
    // Default to memory cache
    cacheConfig.store = 'memory';
    // In-memory store uses milliseconds for TTL
    cacheConfig.ttl = ttl;
    console.log('Successfully configured in-memory cache store.');
  }

  return cacheConfig;
};
