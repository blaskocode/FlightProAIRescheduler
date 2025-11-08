import { NextRequest, NextResponse } from 'next/server';
import { weatherCheckQueue } from '@/lib/jobs/queues';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightId } = body;

    if (flightId) {
      // Manual refresh for specific flight
      const job = await weatherCheckQueue.add('weather-check', {
        flightId,
        checkType: 'MANUAL',
      });

      return NextResponse.json({
        jobId: job.id,
        message: 'Weather check queued',
      });
    } else {
      // Refresh all upcoming flights
      const now = new Date();
      const future = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const flights = await prisma.flight.findMany({
        where: {
          scheduledStart: {
            gte: now,
            lte: future,
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
        },
        select: {
          id: true,
        },
        take: 50, // Limit to prevent overload
      });

      const jobs = await Promise.all(
        flights.map((flight) =>
          weatherCheckQueue.add('weather-check', {
            flightId: flight.id,
            checkType: 'MANUAL',
          })
        )
      );

      return NextResponse.json({
        message: `Queued ${jobs.length} weather checks`,
        jobIds: jobs.map((j) => j.id),
      });
    }
  } catch (error) {
    console.error('Error refreshing weather:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

