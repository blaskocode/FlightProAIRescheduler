import { NextRequest, NextResponse } from 'next/server';
import { checkRouteWeather } from '@/lib/services/route-weather-service';
import { getWeatherMinimums } from '@/lib/services/weather-service';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/weather/route-check
 * Check weather for all waypoints in a flight route
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { route, flightId } = body;

    if (!route && !flightId) {
      return NextResponse.json(
        { error: 'Either route string or flightId is required' },
        { status: 400 }
      );
    }

    let routeString = route;
    let schoolId: string | undefined;
    let minimums: any;

    // If flightId provided, get route and minimums from flight
    if (flightId) {
      const flight = await prisma.flight.findUnique({
        where: { id: flightId },
        include: {
          student: true,
          aircraft: {
            include: {
              aircraftType: true,
            },
          },
        },
      });

      if (!flight) {
        return NextResponse.json(
          { error: 'Flight not found' },
          { status: 404 }
        );
      }

      // Build route from flight data
      routeString = flight.route || `${flight.departureAirport}${flight.destinationAirport ? `-${flight.destinationAirport}` : ''}`;
      schoolId = flight.schoolId;

      // Get minimums
      minimums = getWeatherMinimums(
        flight.student.trainingLevel,
        flight.aircraft.aircraftType,
        flight.flightType
      );
    }

    if (!routeString) {
      return NextResponse.json(
        { error: 'Route string is required' },
        { status: 400 }
      );
    }

    // Check route weather
    const result = await checkRouteWeather(routeString, schoolId, minimums);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error checking route weather:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

