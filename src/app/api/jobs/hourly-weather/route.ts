import { NextRequest, NextResponse } from 'next/server';
import { weatherCheckQueue } from '@/lib/jobs/queues';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get all upcoming flights (next 48 hours)
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

    // Queue weather checks for all flights
    const jobs = await Promise.all(
      flights.map((flight) =>
        weatherCheckQueue.add('weather-check', {
          flightId: flight.id,
          checkType: 'HOURLY',
        })
      )
    );

    return NextResponse.json({
      message: `Queued ${jobs.length} weather checks`,
      jobIds: jobs.map((j) => j.id),
    });
  } catch (error) {
    console.error('Error queuing hourly weather checks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

