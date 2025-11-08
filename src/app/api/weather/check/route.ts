import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFAAWeather, getWeatherMinimums, checkWeatherSafety } from '@/lib/services/weather-service';
import { getAirportCoordinates } from '@/lib/utils/airport-coordinates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightId } = body;

    if (!flightId) {
      return NextResponse.json(
        { error: 'Flight ID required' },
        { status: 400 }
      );
    }

    // Fetch flight with related data
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

    // Fetch weather
    const weather = await fetchFAAWeather(flight.departureAirport);
    
    if (!weather) {
      return NextResponse.json(
        { error: 'Weather data not available' },
        { status: 404 }
      );
    }

    // Get minimums
    const minimums = getWeatherMinimums(
      flight.student.trainingLevel,
      flight.aircraft.aircraftType,
      flight.flightType
    );

    // Check safety
    const checkResult = checkWeatherSafety(weather, minimums);

    // Get airport coordinates
    const coordinates = await getAirportCoordinates(flight.departureAirport);

    // Save weather check to database
    await prisma.weatherCheck.create({
      data: {
        flightId: flight.id,
        checkType: 'MANUAL_REFRESH',
        location: flight.departureAirport,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        rawMetar: JSON.stringify(weather),
        visibility: weather.visibility.value,
        ceiling: weather.clouds[0]?.altitude || 99999,
        windSpeed: weather.wind.speed,
        windGust: weather.wind.gust,
        windDirection: weather.wind.direction,
        temperature: weather.temperature,
        conditions: weather.conditions?.join(',') || 'Clear',
        result: checkResult.result,
        confidence: checkResult.confidence,
        reasons: checkResult.reasons,
        studentTrainingLevel: flight.student.trainingLevel,
        requiredVisibility: minimums.visibility,
        requiredCeiling: minimums.ceiling,
        maxWindSpeed: minimums.maxWind,
      },
    });

    return NextResponse.json({
      weather,
      minimums,
      check: checkResult,
    });
  } catch (error) {
    console.error('Error checking weather:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

