import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Weather Check Queue
export const weatherCheckQueue = new Queue('weather-check', { connection });

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

