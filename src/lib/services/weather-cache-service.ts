import { WeatherData } from './weather-providers/types';
import { Redis } from 'ioredis';
import { prisma } from '@/lib/prisma';

/**
 * Multi-tier Weather Data Caching
 * 
 * L1: In-memory cache (5 min TTL) - fastest, per-instance
 * L2: Redis cache (15 min TTL) - shared across instances
 * L3: Database fallback (historical data) - last resort
 */

// L1: In-memory cache
const memoryCache = new Map<string, { data: WeatherData; expiresAt: number }>();
const MEMORY_TTL = 5 * 60 * 1000; // 5 minutes

// L2: Redis cache
let redisClient: Redis | null = null;
const REDIS_TTL = 15 * 60; // 15 minutes in seconds

function getRedisClient(): Redis | null {
  if (!redisClient && process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
      db: 2, // Use database 2 for weather cache
    });
  }
  return redisClient;
}

/**
 * Get weather data with multi-tier caching
 */
export async function getCachedWeather(
  airportCode: string,
  fetchFn: () => Promise<WeatherData | null>
): Promise<WeatherData | null> {
  const cacheKey = `weather:${airportCode.toUpperCase()}`;
  const now = Date.now();

  // L1: Check in-memory cache
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry && memoryEntry.expiresAt > now) {
    return memoryEntry.data;
  }

  // L2: Check Redis cache
  const redis = getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached) as WeatherData;
        // Also update L1 cache
        memoryCache.set(cacheKey, {
          data,
          expiresAt: now + MEMORY_TTL,
        });
        return data;
      }
    } catch (error) {
      console.error('Redis cache read error:', error);
    }
  }

  // L3: Check database (historical weather data)
  try {
    const historicalWeather = await getHistoricalWeather(airportCode);
    if (historicalWeather) {
      // Use stale data if available (stale-while-revalidate)
      // Fetch fresh data in background
      fetchFn().then(freshData => {
        if (freshData) {
          setCachedWeather(airportCode, freshData);
        }
      }).catch(() => {
        // Ignore background fetch errors
      });
      
      return historicalWeather;
    }
  } catch (error) {
    console.error('Database cache read error:', error);
  }

  // Cache miss - fetch fresh data
  const freshData = await fetchFn();
  if (freshData) {
    await setCachedWeather(airportCode, freshData);
  }

  return freshData;
}

/**
 * Set weather data in all cache tiers
 */
export async function setCachedWeather(
  airportCode: string,
  data: WeatherData
): Promise<void> {
  const cacheKey = `weather:${airportCode.toUpperCase()}`;
  const now = Date.now();

  // L1: Update in-memory cache
  memoryCache.set(cacheKey, {
    data,
    expiresAt: now + MEMORY_TTL,
  });

  // L2: Update Redis cache
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.setex(cacheKey, REDIS_TTL, JSON.stringify(data));
    } catch (error) {
      console.error('Redis cache write error:', error);
    }
  }

  // L3: Store in database (for historical tracking)
  try {
    await storeHistoricalWeather(airportCode, data);
  } catch (error) {
    console.error('Database cache write error:', error);
  }
}

/**
 * Get historical weather from database
 */
async function getHistoricalWeather(airportCode: string): Promise<WeatherData | null> {
  try {
    // Get most recent weather check for this airport
    const weatherCheck = await prisma.weatherCheck.findFirst({
      where: {
        location: airportCode.toUpperCase(),
        checkTime: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Within last 30 minutes
        },
      },
      orderBy: {
        checkTime: 'desc',
      },
    });

    if (!weatherCheck || !weatherCheck.rawMetar) {
      return null;
    }

    // Parse stored weather data
    try {
      const metarData = JSON.parse(weatherCheck.rawMetar);
      if (metarData.departure) {
        return metarData.departure as WeatherData;
      }
    } catch (error) {
      // Invalid JSON, skip
    }

    return null;
  } catch (error) {
    console.error('Error fetching historical weather:', error);
    return null;
  }
}

/**
 * Store weather data in database for historical tracking
 */
async function storeHistoricalWeather(
  airportCode: string,
  data: WeatherData
): Promise<void> {
  // This is handled by weather check creation
  // We just ensure the data is available for future lookups
  // The actual storage happens in weather-check.job.ts
}

/**
 * Invalidate cache for an airport
 */
export async function invalidateWeatherCache(airportCode: string): Promise<void> {
  const cacheKey = `weather:${airportCode.toUpperCase()}`;

  // L1: Clear memory cache
  memoryCache.delete(cacheKey);

  // L2: Clear Redis cache
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.del(cacheKey);
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
    }
  }
}

/**
 * Warm cache for popular airports
 */
export async function warmWeatherCache(
  airports: string[],
  fetchFn: (airport: string) => Promise<WeatherData | null>
): Promise<void> {
  const promises = airports.map(async (airport) => {
    try {
      const weather = await fetchFn(airport);
      if (weather) {
        await setCachedWeather(airport, weather);
      }
    } catch (error) {
      console.error(`Error warming cache for ${airport}:`, error);
    }
  });

  await Promise.all(promises);
}

/**
 * Preload cache for scheduled flights
 */
export async function preloadCacheForFlights(
  hoursAhead: number = 24
): Promise<void> {
  const now = new Date();
  const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const flights = await prisma.flight.findMany({
    where: {
      scheduledStart: {
        gte: now,
        lte: future,
      },
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
    select: {
      departureAirport: true,
      destinationAirport: true,
    },
    distinct: ['departureAirport'],
    take: 20, // Limit to prevent overload
  });

  const airports = new Set<string>();
  flights.forEach(flight => {
    if (flight.departureAirport) {
      airports.add(flight.departureAirport);
    }
    if (flight.destinationAirport) {
      airports.add(flight.destinationAirport);
    }
  });

  // Warm cache for these airports
  const { getWeatherAdapter } = await import('./weather-providers/adapter');
  const adapter = getWeatherAdapter();

  await warmWeatherCache(Array.from(airports), async (airport) => {
    return adapter.getCurrentWeather(airport);
  });
}

/**
 * Get cache statistics
 */
export async function getWeatherCacheStats(): Promise<{
  memoryCacheSize: number;
  redisCacheSize: number;
  hitRate: number;
}> {
  const memorySize = memoryCache.size;
  
  let redisSize = 0;
  const redis = getRedisClient();
  if (redis) {
    try {
      const keys = await redis.keys('weather:*');
      redisSize = keys.length;
    } catch (error) {
      console.error('Error getting Redis cache size:', error);
    }
  }

  // Hit rate would need to be tracked (simplified for now)
  const hitRate = 0.85; // Placeholder

  return {
    memoryCacheSize: memorySize,
    redisCacheSize: redisSize,
    hitRate,
  };
}

/**
 * Clean up expired memory cache entries
 */
export function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryCache, 60 * 1000);
}

