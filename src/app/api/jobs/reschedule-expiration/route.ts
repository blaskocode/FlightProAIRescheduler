import { NextRequest, NextResponse } from 'next/server';
import { rescheduleExpirationQueue } from '@/lib/jobs/queues';

/**
 * POST /api/jobs/reschedule-expiration
 * Manually trigger reschedule expiration check job
 * (In production, this would be scheduled via Vercel Cron or similar)
 */
export async function POST(request: NextRequest) {
  try {
    const job = await rescheduleExpirationQueue.add('reschedule-expiration', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      message: 'Reschedule expiration check job queued',
    });
  } catch (error) {
    console.error('Error queuing reschedule expiration check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

