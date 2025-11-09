import { NextRequest, NextResponse } from 'next/server';
import { weatherCheckQueue } from '@/lib/jobs/queues';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Require authentication (admin only)
    const authUser = await requireAuth(request);
    
    // Check if user is admin
    if (authUser.role !== 'admin' && authUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { flightId } = body;

    if (flightId) {
      // Manual refresh for specific flight
      const job = await weatherCheckQueue.add('weather-check', {
        flightId,
        checkType: 'MANUAL',
      });

      // Wait for job to complete (with 60 second timeout)
      try {
        await job.waitUntilFinished(60000);
        const state = await job.getState();
        
        if (state === 'completed') {
          return NextResponse.json({
            jobId: job.id,
            message: 'Weather check completed successfully',
            success: 1,
            failed: 0,
          });
        } else {
          return NextResponse.json({
            jobId: job.id,
            message: 'Weather check failed',
            success: 0,
            failed: 1,
          });
        }
      } catch (waitError: any) {
        // Job may have failed or timed out
        const state = await job.getState();
        return NextResponse.json({
          jobId: job.id,
          message: state === 'failed' ? 'Weather check failed' : 'Weather check timed out',
          success: state === 'completed' ? 1 : 0,
          failed: state === 'failed' ? 1 : 0,
        });
      }
    } else {
      // Refresh all upcoming flights - ASYNCHRONOUS MODE for scalability
      const now = new Date();
      const future = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // Get all flights (no limit for manual refresh - let queue handle it)
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
        },
        orderBy: {
          scheduledStart: 'asc', // Process earlier flights first
        },
      });

      // Queue all jobs with priority based on how soon the flight is scheduled
      // Flights within 24 hours get higher priority
      const priorityThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const jobs = await Promise.all(
        flights.map((flight) => {
          const isUrgent = new Date(flight.scheduledStart) <= priorityThreshold;
          return weatherCheckQueue.add(
            'weather-check',
            {
              flightId: flight.id,
              checkType: 'MANUAL',
            },
            {
              priority: isUrgent ? 1 : 10, // Lower number = higher priority
              attempts: 2, // Retry once on failure
              backoff: {
                type: 'exponential',
                delay: 5000, // 5 second delay on retry
              },
              jobId: `weather-check-${flight.id}-${Date.now()}`, // Custom job ID for easier tracking
            }
          );
        })
      );

      // Return immediately - jobs will process in background
      // Track by flight IDs instead of job IDs (more reliable)
      const totalFlights = flights.length;
      const flightIds = flights.map(f => f.id);
      
      console.log(`Queued ${totalFlights} weather check jobs for ${flightIds.length} flights`);
      
      return NextResponse.json({
        message: `Queued ${totalFlights} weather checks. Processing in background...`,
        queued: totalFlights,
        flightIds: flightIds, // Track by flight IDs instead
        async: true, // Indicates this is async processing
        note: 'Weather checks are being processed in the background. Check flight status for updates.',
      });
    }
  } catch (error: any) {
    console.error('Error refreshing weather:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

