import { NextRequest, NextResponse } from 'next/server';
import { preloadCacheForFlights } from '@/lib/services/weather-cache-service';

/**
 * POST /api/weather/cache/warm
 * Warm weather cache for scheduled flights
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hoursAhead = body.hoursAhead || 24;

    await preloadCacheForFlights(hoursAhead);

    return NextResponse.json({
      success: true,
      message: `Cache warmed for flights in next ${hoursAhead} hours`,
    });
  } catch (error: any) {
    console.error('Error warming cache:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

