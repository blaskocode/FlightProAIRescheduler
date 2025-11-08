import { NextRequest, NextResponse } from 'next/server';
import { weatherCheckQueue } from '@/lib/jobs/queues';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightId, checkType = 'MANUAL' } = body;

    if (!flightId) {
      return NextResponse.json(
        { error: 'Flight ID required' },
        { status: 400 }
      );
    }

    const job = await weatherCheckQueue.add('weather-check', {
      flightId,
      checkType,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
    });
  } catch (error) {
    console.error('Error queuing weather check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

