import { NextRequest, NextResponse } from 'next/server';
import { getWeatherCacheStats } from '@/lib/services/weather-cache-service';

/**
 * GET /api/weather/cache/stats
 * Get weather cache statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await getWeatherCacheStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

