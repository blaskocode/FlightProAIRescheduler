import { NextRequest, NextResponse } from 'next/server';
import { calculateForecastConfidence } from '@/lib/services/forecast-confidence-service';
import { prisma } from '@/lib/prisma';
import { getWeatherAdapter } from '@/lib/services/weather-providers/adapter';

/**
 * GET /api/weather/forecast-confidence/:flightId
 * Get forecast confidence for a flight
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { flightId: string } }
) {
  try {
    const flight = await prisma.flight.findUnique({
      where: { id: params.flightId },
      include: {
        weatherChecks: {
          orderBy: { checkTime: 'desc' },
          take: 5,
        },
      },
    });

    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    // Get current weather
    const adapter = getWeatherAdapter();
    const currentWeather = await adapter.getCurrentWeather(
      flight.departureAirport,
      flight.schoolId
    );

    if (!currentWeather) {
      return NextResponse.json(
        { error: 'Weather data not available' },
        { status: 404 }
      );
    }

    // Calculate confidence
    const confidence = await calculateForecastConfidence(
      params.flightId,
      currentWeather,
      flight.scheduledStart
    );

    return NextResponse.json(confidence);
  } catch (error: any) {
    console.error('Error calculating forecast confidence:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

