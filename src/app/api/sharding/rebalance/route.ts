import { NextRequest, NextResponse } from 'next/server';
import { generateRebalancePlan, executeRebalance } from '@/lib/db/shard-rebalancing';

/**
 * POST /api/sharding/rebalance
 * Generate or execute rebalance plan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetShardCount, dryRun = true } = body;

    // Get auth user (in production, verify Firebase token)
    const uid = request.nextUrl.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if super admin (in production, use proper auth)

    if (!targetShardCount || targetShardCount < 1) {
      return NextResponse.json(
        { error: 'targetShardCount is required and must be >= 1' },
        { status: 400 }
      );
    }

    const plan = await generateRebalancePlan(targetShardCount);
    const stats = await executeRebalance(plan, dryRun);

    return NextResponse.json({
      plan: plan.slice(0, 100), // Limit response size
      planCount: plan.length,
      stats,
      dryRun,
    });
  } catch (error: any) {
    console.error('Error rebalancing shards:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

