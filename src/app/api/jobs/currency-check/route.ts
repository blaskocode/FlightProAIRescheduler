import { NextRequest, NextResponse } from 'next/server';
import { currencyCheckQueue } from '@/lib/jobs/queues';

export async function POST(request: NextRequest) {
  try {
    const job = await currencyCheckQueue.add('currency-check', {}, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      message: 'Currency check job queued',
    });
  } catch (error) {
    console.error('Error queuing currency check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

