/**
 * Local Development Scheduler
 * 
 * Automatically triggers scheduled jobs in development mode.
 * In production, Vercel Cron handles scheduling.
 */

import { weatherCheckQueue } from './queues';
import { prisma } from '@/lib/prisma';

let schedulerInterval: NodeJS.Timeout | null = null;
let isRunning = false;

export function startLocalScheduler() {
  if (process.env.NODE_ENV === 'production') {
    // Don't run in production - use Vercel Cron
    console.log('ℹ️  Local scheduler skipped (production mode - using Vercel Cron)');
    return;
  }

  if (schedulerInterval || isRunning) {
    // Already running
    return;
  }

  console.log('🕐 Starting local development scheduler...');
  isRunning = true;
  
  // Run immediately on start (after a short delay to let server initialize)
  setTimeout(() => {
    triggerHourlyWeatherCheck();
  }, 5000); // 5 second delay to let server fully start
  
  // Then run every hour
  schedulerInterval = setInterval(() => {
    triggerHourlyWeatherCheck();
  }, 60 * 60 * 1000); // 1 hour

  console.log('✅ Local scheduler started (runs every hour)');
  console.log('   First check will run in 5 seconds...');
}

async function triggerHourlyWeatherCheck() {
  try {
    console.log('🌤️  Local scheduler: Triggering hourly weather checks...');
    
    const now = new Date();
    const future = new Date(now.getTime() + 48 * 60 * 60 * 1000);

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
        id: true,
      },
    });

    if (flights.length === 0) {
      console.log('   No upcoming flights to check');
      return;
    }

    const jobs = await Promise.all(
      flights.map((flight) =>
        weatherCheckQueue.add('weather-check', {
          flightId: flight.id,
          checkType: 'HOURLY',
        })
      )
    );

    console.log(`✅ Local scheduler: Queued ${jobs.length} weather checks`);
    console.log(`   Jobs will be processed by workers in the background`);
  } catch (error: any) {
    console.error('❌ Error in local scheduler:', error.message);
  }
}

export function stopLocalScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    isRunning = false;
    console.log('🛑 Local scheduler stopped');
  }
}

// Auto-start when module is imported (in development only)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  // Small delay to ensure Redis connection is ready
  setTimeout(() => {
    startLocalScheduler();
  }, 1000);
}


