import { NextRequest, NextResponse } from 'next/server';
import { maintenanceReminderQueue } from '@/lib/jobs/queues';

export async function POST(request: NextRequest) {
  try {
    const job = await maintenanceReminderQueue.add('maintenance-reminder', {}, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      message: 'Maintenance reminder job queued',
    });
  } catch (error) {
    console.error('Error queuing maintenance reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

