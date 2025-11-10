import { Redis } from 'ioredis';

/**
 * Query Cache Service
 * Caches database query results in Redis to reduce database load
 */

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!redisClient && process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
      // Use a separate database for caching (default is 0, use 1 for cache)
      db: 1,
    });
  }
  return redisClient;
}

/**
 * Generate cache key from query parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `cache:${prefix}:${sortedParams}`;
}

/**
 * Cache query result
 */
export async function cacheQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300 // 5 minutes default
): Promise<T> {
  const redis = getRedisClient();
  
  if (!redis) {
    // No Redis - execute query directly
    return queryFn();
  }

  try {
    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    // Execute query
    const result = await queryFn();

    // Cache result
    await redis.setex(key, ttlSeconds, JSON.stringify(result));

    return result;
  } catch (error) {
    console.error('Cache error:', error);
    // On cache error, execute query directly
    return queryFn();
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keys = await redis.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Cache decorator for functions
 */
export function cached(
  prefix: string,
  ttlSeconds: number = 300,
  keyGenerator?: (...args: any[]) => string
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator
        ? keyGenerator(...args)
        : generateCacheKey(`${prefix}:${propertyName}`, { args });
      
      return cacheQuery(key, () => method.apply(this, args), ttlSeconds);
    };

    return descriptor;
  };
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  hitRate: number;
  totalKeys: number;
  memoryUsage: string;
}> {
  const redis = getRedisClient();
  if (!redis) {
    return { hitRate: 0, totalKeys: 0, memoryUsage: '0B' };
  }

  try {
    const info = await redis.info('stats');
    const keyspace = await redis.info('keyspace');
    
    // Parse Redis info (simplified)
    const keyspaceMatch = keyspace.match(/keys=(\d+)/);
    const totalKeys = keyspaceMatch ? parseInt(keyspaceMatch[1]) : 0;

    // Calculate hit rate (simplified - would need to track hits/misses)
    const hitRate = 0.75; // Placeholder

    return {
      hitRate,
      totalKeys,
      memoryUsage: 'N/A', // Would parse from info
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { hitRate: 0, totalKeys: 0, memoryUsage: '0B' };
  }
}

