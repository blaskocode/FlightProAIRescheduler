import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

/**
 * Get Redis connection (lazy initialization)
 * Only initializes when actually needed, preventing build-time errors
 */
let connection: Redis | null = null;

function getConnection(): Redis | null {
  // Don't create connection during build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }

  if (!connection && process.env.REDIS_URL) {
    try {
      connection = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        // Use lazy connect to prevent immediate connection attempts
        lazyConnect: true,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        // Don't fail on connection errors during initialization
        enableOfflineQueue: false,
      });
    } catch (error) {
      // Silently fail during build - Redis will be available at runtime
      return null;
    }
  }
  return connection;
}

// Create connection only if REDIS_URL is available
const redisConnection = process.env.REDIS_URL && process.env.NEXT_PHASE !== 'phase-production-build'
  ? getConnection()
  : null;

// Weather Check Queue
// Configure to keep completed/failed jobs for status tracking
export const weatherCheckQueue = new Queue('weather-check', { 
  connection: redisConnection || undefined,
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep up to 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
      count: 500, // Keep up to 500 failed jobs
    },
  },
});

// Currency Check Queue
export const currencyCheckQueue = new Queue('currency-check', { 
  connection: redisConnection || undefined 
});

// Maintenance Reminder Queue
export const maintenanceReminderQueue = new Queue('maintenance-reminder', { 
  connection: redisConnection || undefined 
});

// Reschedule Expiration Queue
export const rescheduleExpirationQueue = new Queue('reschedule-expiration', { 
  connection: redisConnection || undefined 
});

export const predictionGenerationQueue = new Queue('prediction-generation', { 
  connection: redisConnection || undefined 
});

// Notification Queue
export const notificationQueue = new Queue('notification', { 
  connection: redisConnection || undefined 
});

export { getConnection as connection };

// Import workers to ensure they start when the module is loaded
// This is important for Next.js - workers need to be imported somewhere
// Side-effect import: workers start automatically when this module loads
if (typeof window === 'undefined') {
  // Only import workers on the server side (not in browser)
  // This ensures workers start when the server starts
  import('./workers');
  
  // Start local scheduler for development (Vercel Cron handles production)
  if (process.env.NODE_ENV !== 'production') {
    import('./local-scheduler');
  }
}

