import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { predictCancellation } from '@/lib/services/prediction-service';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/predictions/cancellation
 * Predict cancellation probability for a flight
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();
    const { flightId } = body;

    if (!flightId) {
      return NextResponse.json(
        { error: 'flightId is required' },
        { status: 400 }
      );
    }

    // Get flight details
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      include: {
        student: true,
        instructor: true,
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
        weatherChecks: {
          orderBy: { checkTime: 'desc' },
          take: 1,
        },
      },
    });

    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    // Get latest weather forecast if available
    let weatherForecast;
    if (flight.weatherChecks.length > 0) {
      const latestCheck = flight.weatherChecks[0];
      weatherForecast = {
        visibility: latestCheck.visibility ?? undefined,
        ceiling: latestCheck.ceiling ?? undefined,
        windSpeed: latestCheck.windSpeed ?? undefined,
        windGust: latestCheck.windGust ?? undefined,
        conditions: latestCheck.reasons as string[],
      };
    }

    // Generate prediction
    const prediction = await predictCancellation({
      flightId: flight.id,
      scheduledStart: flight.scheduledStart,
      studentLevel: flight.student.trainingLevel,
      aircraftType: flight.aircraft.aircraftType.make + ' ' + flight.aircraft.aircraftType.model,
      departureAirport: flight.departureAirport,
      weatherForecast,
    });

    // Store prediction in flight record
    await prisma.flight.update({
      where: { id: flightId },
      data: {
        cancellationPrediction: prediction.cancellationProbability,
        predictionConfidence: prediction.confidence,
        predictionMadeAt: new Date(),
      },
    });

    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error('Error generating prediction:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/predictions/cancellation
 * Get cancellation predictions for multiple flights
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const flightIds = searchParams.get('flightIds')?.split(',') || [];
    const schoolId = searchParams.get('schoolId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (flightIds.length === 0 && !schoolId) {
      return NextResponse.json(
        { error: 'Either flightIds or schoolId is required' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (flightIds.length > 0) {
      where.id = { in: flightIds };
    }
    if (schoolId) {
      where.schoolId = schoolId;
    }
    if (startDate || endDate) {
      where.scheduledStart = {};
      if (startDate) where.scheduledStart.gte = new Date(startDate);
      if (endDate) where.scheduledStart.lte = new Date(endDate);
    }

    const flights = await prisma.flight.findMany({
      where,
      include: {
        student: true,
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
        weatherChecks: {
          orderBy: { checkTime: 'desc' },
          take: 1,
        },
      },
      take: 50, // Limit to 50 flights
    });

    const predictions = await Promise.all(
      flights.map(async (flight) => {
        let weatherForecast;
        if (flight.weatherChecks.length > 0) {
          const latestCheck = flight.weatherChecks[0];
          weatherForecast = {
            visibility: latestCheck.visibility ?? undefined,
            ceiling: latestCheck.ceiling ?? undefined,
            windSpeed: latestCheck.windSpeed ?? undefined,
            windGust: latestCheck.windGust ?? undefined,
            conditions: latestCheck.reasons as string[],
          };
        }

        const prediction = await predictCancellation({
          flightId: flight.id,
          scheduledStart: flight.scheduledStart,
          studentLevel: flight.student.trainingLevel,
          aircraftType: flight.aircraft.aircraftType.make + ' ' + flight.aircraft.aircraftType.model,
          departureAirport: flight.departureAirport,
          weatherForecast,
        });

        return {
          flightId: flight.id,
          scheduledStart: flight.scheduledStart,
          ...prediction,
        };
      })
    );

    return NextResponse.json({ predictions });
  } catch (error: any) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

