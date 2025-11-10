import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

/**
 * Get Redis connection (lazy initialization)
 * Only initializes when actually needed, preventing build-time errors
 */
let connection: Redis | null = null;

function getConnection(): Redis {
  // During build phase, create a dummy connection that won't actually connect
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.REDIS_URL) {
    // Create a dummy Redis instance that uses lazyConnect and won't fail during build
    return new Redis('redis://localhost:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null, // Don't retry during build
      connectTimeout: 1, // Very short timeout
    });
  }

  if (!connection) {
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
      // Fallback to dummy connection if creation fails
      return new Redis('redis://localhost:6379', {
        maxRetriesPerRequest: null,
        lazyConnect: true,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      });
    }
  }
  return connection;
}

// Get connection (will be dummy during build, real at runtime)
const redisConnection = getConnection();

// Weather Check Queue
// Configure to keep completed/failed jobs for status tracking
export const weatherCheckQueue = new Queue('weather-check', { 
  connection: redisConnection,
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
  connection: redisConnection 
});

// Maintenance Reminder Queue
export const maintenanceReminderQueue = new Queue('maintenance-reminder', { 
  connection: redisConnection 
});

// Reschedule Expiration Queue
export const rescheduleExpirationQueue = new Queue('reschedule-expiration', { 
  connection: redisConnection 
});

export const predictionGenerationQueue = new Queue('prediction-generation', { 
  connection: redisConnection 
});

// Notification Queue
export const notificationQueue = new Queue('notification', { 
  connection: redisConnection 
});

export { redisConnection as connection };

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

