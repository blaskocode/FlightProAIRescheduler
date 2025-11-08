import { NextRequest, NextResponse } from 'next/server';
import { generateWeatherInsights } from '@/lib/services/weather-analytics-service';

/**
 * GET /api/weather/analytics/insights
 * Generate predictive weather insights
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId is required' },
        { status: 400 }
      );
    }

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); // Default to 1 year

    const insights = await generateWeatherInsights(schoolId, startDate, endDate);

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('Error generating weather insights:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

