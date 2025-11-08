import { NextRequest, NextResponse } from 'next/server';
import { getCancellationTrends } from '@/lib/services/weather-analytics-service';

/**
 * GET /api/weather/analytics/cancellation-trends
 * Get cancellation trends over time
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day';

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId is required' },
        { status: 400 }
      );
    }

    if (!['day', 'week', 'month'].includes(groupBy)) {
      return NextResponse.json(
        { error: 'groupBy must be day, week, or month' },
        { status: 400 }
      );
    }

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); // Default to 90 days

    const trends = await getCancellationTrends(
      schoolId,
      startDate,
      endDate,
      groupBy as 'day' | 'week' | 'month'
    );

    return NextResponse.json(trends);
  } catch (error: any) {
    console.error('Error fetching cancellation trends:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

