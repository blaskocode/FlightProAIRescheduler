import { NextRequest, NextResponse } from 'next/server';
import { invalidateWeatherCache } from '@/lib/services/weather-cache-service';

/**
 * POST /api/weather/cache/invalidate
 * Invalidate weather cache for an airport
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { airportCode } = body;

    if (!airportCode) {
      return NextResponse.json(
        { error: 'airportCode is required' },
        { status: 400 }
      );
    }

    await invalidateWeatherCache(airportCode);

    return NextResponse.json({
      success: true,
      message: `Cache invalidated for ${airportCode}`,
    });
  } catch (error: any) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

