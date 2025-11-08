import { NextRequest, NextResponse } from 'next/server';
import { getWatchListFlights } from '@/lib/services/forecast-confidence-service';

/**
 * GET /api/weather/watch-list
 * Get flights on watch list (medium confidence)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId') || undefined;

    const watchList = await getWatchListFlights(schoolId || undefined);

    return NextResponse.json({
      flights: watchList,
      count: watchList.length,
    });
  } catch (error: any) {
    console.error('Error fetching watch list:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

