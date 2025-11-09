/**
 * Script to trigger weather checks for all upcoming flights
 * 
 * This will queue weather check jobs for all flights in the next 48 hours
 * 
 * Usage: npx tsx scripts/trigger-weather-checks.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Import queues after env is loaded
const { weatherCheckQueue } = require('../src/lib/jobs/queues');

const prisma = new PrismaClient();

async function triggerWeatherChecks() {
  try {
    console.log('🌤️  Triggering weather checks for upcoming flights...\n');

    const now = new Date();
    const future = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Next 48 hours

    // Get all upcoming flights
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
        scheduledStart: true,
        departureAirport: true,
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    console.log(`📊 Found ${flights.length} upcoming flights in the next 48 hours\n`);

    if (flights.length === 0) {
      console.log('✅ No flights to check. All done!');
      await prisma.$disconnect();
      return;
    }

    // Queue weather checks with priority (earlier flights get higher priority)
    const priorityThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    let queued = 0;
    let errors = 0;

    for (const flight of flights) {
      try {
        const isUrgent = new Date(flight.scheduledStart) <= priorityThreshold;
        await weatherCheckQueue.add(
          'weather-check',
          {
            flightId: flight.id,
            checkType: 'MANUAL',
          },
          {
            priority: isUrgent ? 1 : 10,
            attempts: 2,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            jobId: `weather-check-${flight.id}-${Date.now()}`,
          }
        );
        queued++;
        
        if (queued % 10 === 0) {
          console.log(`  Queued ${queued}/${flights.length} weather checks...`);
        }
      } catch (error: any) {
        console.error(`  Error queuing check for flight ${flight.id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Successfully queued ${queued} weather checks`);
    if (errors > 0) {
      console.log(`⚠️  ${errors} errors occurred`);
    }
    console.log('\n⏳ Weather checks are processing in the background...');
    console.log('   Check the dashboard in a few minutes to see weather alerts!');
    console.log('\n💡 Tip: You can check job status at /api/weather/refresh/status');

  } catch (error: any) {
    console.error('\n❌ Error triggering weather checks:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

triggerWeatherChecks();

