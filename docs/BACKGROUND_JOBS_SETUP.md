# Background Jobs Setup Guide

## Current Architecture

The application uses **BullMQ with Redis** for background job processing:
- **Workers**: Process jobs from queues (weather checks, currency checks, etc.)
- **Queues**: Store jobs waiting to be processed
- **Schedulers**: Trigger jobs on a schedule (hourly, daily, etc.)

## The Problem

### Production (Vercel)
- ✅ **Vercel Cron** (`vercel.json`) calls `/api/jobs/hourly-weather` every hour
- ✅ Works automatically when deployed to Vercel
- ⚠️ **Limitation**: Vercel Cron only works on Vercel, not in local development

### Local Development
- ❌ **Vercel Cron doesn't run** - it's a Vercel-specific feature
- ✅ **Workers are running** - they process jobs when queued
- ❌ **No automatic scheduling** - jobs need to be triggered manually

## Solutions

### Option 1: Local Development Scheduler (Recommended for Dev)

Create a simple scheduler that runs in development mode:

**File**: `src/lib/jobs/local-scheduler.ts`

```typescript
import { weatherCheckQueue } from './queues';
import { prisma } from '@/lib/prisma';

let schedulerInterval: NodeJS.Timeout | null = null;

export function startLocalScheduler() {
  if (process.env.NODE_ENV === 'production') {
    // Don't run in production - use Vercel Cron
    return;
  }

  if (schedulerInterval) {
    // Already running
    return;
  }

  console.log('🕐 Starting local development scheduler...');
  
  // Run immediately on start
  triggerHourlyWeatherCheck();
  
  // Then run every hour
  schedulerInterval = setInterval(() => {
    triggerHourlyWeatherCheck();
  }, 60 * 60 * 1000); // 1 hour

  console.log('✅ Local scheduler started (runs every hour)');
}

async function triggerHourlyWeatherCheck() {
  try {
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

    const jobs = await Promise.all(
      flights.map((flight) =>
        weatherCheckQueue.add('weather-check', {
          flightId: flight.id,
          checkType: 'HOURLY',
        })
      )
    );

    console.log(`🌤️  Local scheduler: Queued ${jobs.length} weather checks`);
  } catch (error) {
    console.error('❌ Error in local scheduler:', error);
  }
}

export function stopLocalScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('🛑 Local scheduler stopped');
  }
}
```

**Update**: `src/lib/jobs/queues.ts` to start scheduler:

```typescript
// At the end of queues.ts
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  // Start local scheduler for development
  import('./local-scheduler').then(({ startLocalScheduler }) => {
    startLocalScheduler();
  });
}
```

### Option 2: Firebase Cloud Functions (Production Backup)

Firebase Cloud Functions can run on a schedule and work independently of Vercel:

**Advantages**:
- ✅ Works in both dev and production
- ✅ Independent of hosting provider
- ✅ Reliable scheduling
- ✅ Can be triggered manually for testing

**Setup**:
1. Create Firebase Functions project
2. Deploy scheduled function that calls your API endpoint
3. Configure to run every hour

### Option 3: External Cron Service (Simple)

Use a service like **cron-job.org** or **EasyCron**:
- ✅ Simple setup
- ✅ Works in dev and production
- ✅ Free tier available
- ⚠️ Requires public API endpoint

### Option 4: Hybrid Approach (Recommended)

**For Local Development**:
- Use Option 1 (local scheduler)
- Automatically starts when dev server starts
- Runs every hour

**For Production**:
- Primary: Vercel Cron (already configured)
- Backup: Firebase Cloud Functions (optional, for redundancy)
- Manual trigger: Admin UI button (already exists)

## Recommended Implementation

I recommend **Option 1 (Local Scheduler)** for immediate development needs, with **Option 2 (Firebase Functions)** as a production backup.

### Why This Approach?

1. **Local Development**: 
   - Scheduler runs automatically
   - No external dependencies
   - Easy to test and debug

2. **Production**:
   - Vercel Cron (primary) - already configured
   - Firebase Functions (backup) - independent, reliable
   - Manual trigger (admin UI) - for immediate checks

3. **Flexibility**:
   - Can adjust schedule easily
   - Can test different intervals
   - Can manually trigger when needed

## Implementation Steps

1. ✅ Create local scheduler (Option 1)
2. ⏳ Set up Firebase Functions (Option 2) - optional but recommended
3. ✅ Keep Vercel Cron as primary in production
4. ✅ Keep manual trigger button in admin UI

## Testing

After implementing:
1. Start dev server: `npm run dev`
2. Check console for: "🕐 Starting local development scheduler..."
3. Wait 1 hour (or adjust interval for testing)
4. Verify weather checks are queued automatically
5. Check dashboard for new weather alerts

## Current Status

- ✅ Workers: Running and processing jobs
- ✅ Queues: Configured with Redis
- ✅ API Endpoints: `/api/jobs/hourly-weather` ready
- ❌ Local Scheduler: Not implemented (needs Option 1)
- ✅ Vercel Cron: Configured for production
- ⏳ Firebase Functions: Not set up (optional)


