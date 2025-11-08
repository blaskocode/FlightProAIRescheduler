import { NextRequest, NextResponse } from 'next/server';
import { fetchFAAWeather } from '@/lib/services/weather-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const airportCode = params.code.toUpperCase();
    
    if (!airportCode || airportCode.length !== 4) {
      return NextResponse.json(
        { error: 'Invalid airport code' },
        { status: 400 }
      );
    }

    const weather = await fetchFAAWeather(airportCode);
    
    if (!weather) {
      return NextResponse.json(
        { error: 'Weather data not available' },
        { status: 404 }
      );
    }

    return NextResponse.json(weather);
  } catch (error) {
    console.error('Error fetching weather:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

