import { NextRequest, NextResponse } from 'next/server';
import { predictionGenerationQueue } from '@/lib/jobs/queues';

/**
 * POST /api/jobs/prediction-generation
 * Trigger prediction generation job (called by cron)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if set (for security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Add job to queue
    const job = await predictionGenerationQueue.add('generate-predictions', {}, {
      priority: 1,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Prediction generation job queued',
    });
  } catch (error: any) {
    console.error('Error queuing prediction generation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

