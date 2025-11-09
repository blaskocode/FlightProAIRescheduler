import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Weather Check Queue
// Configure to keep completed/failed jobs for status tracking
export const weatherCheckQueue = new Queue('weather-check', { 
  connection,
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
export const currencyCheckQueue = new Queue('currency-check', { connection });

// Maintenance Reminder Queue
export const maintenanceReminderQueue = new Queue('maintenance-reminder', { connection });

// Reschedule Expiration Queue
export const rescheduleExpirationQueue = new Queue('reschedule-expiration', { connection });
export const predictionGenerationQueue = new Queue('prediction-generation', { connection });

// Notification Queue
export const notificationQueue = new Queue('notification', { connection });

export { connection };

// Import workers to ensure they start when the module is loaded
// This is important for Next.js - workers need to be imported somewhere
// Side-effect import: workers start automatically when this module loads
if (typeof window === 'undefined') {
  // Only import workers on the server side (not in browser)
  // This ensures workers start when the server starts
  import('./workers');
}

