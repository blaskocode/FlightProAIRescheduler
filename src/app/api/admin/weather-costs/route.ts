import { NextRequest, NextResponse } from 'next/server';
import { getWeatherAdapter } from '@/lib/services/weather-providers/adapter';

/**
 * GET /api/admin/weather-costs
 * Get weather API cost tracking data
 */
export async function GET(request: NextRequest) {
  try {
    const adapter = getWeatherAdapter();
    const costs = adapter.getCosts();
    
    // Convert Map to object for JSON response
    const costsObject: Record<string, number> = {};
    costs.forEach((value, key) => {
      costsObject[key] = value;
    });
    
    return NextResponse.json({
      costs: costsObject,
      total: Array.from(costs.values()).reduce((sum, cost) => sum + cost, 0),
    });
  } catch (error) {
    console.error('Error fetching weather costs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/weather-costs/reset
 * Reset weather API cost tracking
 */
export async function POST(request: NextRequest) {
  try {
    const adapter = getWeatherAdapter();
    adapter.resetCosts();
    
    return NextResponse.json({
      success: true,
      message: 'Cost tracking reset',
    });
  } catch (error) {
    console.error('Error resetting weather costs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

