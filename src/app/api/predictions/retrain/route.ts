import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions/check';
import { predictionGenerationQueue } from '@/lib/jobs/queues';

/**
 * POST /api/predictions/retrain
 * Trigger prediction generation for all upcoming flights (admin only)
 * This can be used to manually retrain/update predictions
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();

    // Only admins can trigger retraining
    if (!(await hasPermission(authUser, 'analytics.view'))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
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
    console.error('Error triggering prediction generation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

