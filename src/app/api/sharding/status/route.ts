import { NextRequest, NextResponse } from 'next/server';
import { getShardMetadata } from '@/lib/db/shard-routing';
import { analyzeShardDistribution, isRebalancingNeeded } from '@/lib/db/shard-rebalancing';

/**
 * GET /api/sharding/status
 * Get sharding status and health
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth user (in production, verify Firebase token)
    const uid = request.nextUrl.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if super admin (in production, use proper auth)
    // For now, we'll allow if uid is provided

    const [metadata, distribution, needsRebalance] = await Promise.all([
      getShardMetadata(),
      analyzeShardDistribution(),
      isRebalancingNeeded(),
    ]);

    return NextResponse.json({
      shards: metadata,
      distribution,
      needsRebalance,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching sharding status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

