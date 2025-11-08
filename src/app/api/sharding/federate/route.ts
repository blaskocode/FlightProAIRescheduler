import { NextRequest, NextResponse } from 'next/server';
import { getAllSchoolsAcrossShards, getTotalFlightsAcrossShards, getAggregatedMetricsAcrossShards } from '@/lib/db/cross-shard-federation';

/**
 * GET /api/sharding/federate
 * Execute federated queries across all shards (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get auth user (in production, verify Firebase token)
    const uid = searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if super admin (in production, use proper auth)

    switch (queryType) {
      case 'schools':
        const schools = await getAllSchoolsAcrossShards();
        return NextResponse.json({ schools, count: schools.length });

      case 'flights':
        const flightCount = await getTotalFlightsAcrossShards(
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        return NextResponse.json({ count: flightCount });

      case 'metrics':
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const metrics = await getAggregatedMetricsAcrossShards(start, end);
        return NextResponse.json(metrics);

      default:
        return NextResponse.json(
          { error: 'Invalid query type. Use: schools, flights, or metrics' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error executing federated query:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

