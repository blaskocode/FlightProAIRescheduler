import { NextRequest, NextResponse } from 'next/server';
import { getAirportCoordinates } from '@/lib/utils/airport-coordinates';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const airportCode = params.code;
    
    if (!airportCode) {
      return NextResponse.json(
        { error: 'Airport code is required' },
        { status: 400 }
      );
    }

    const coordinates = await getAirportCoordinates(airportCode);
    
    return NextResponse.json(coordinates);
  } catch (error: any) {
    console.error('Error fetching airport coordinates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch airport coordinates' },
      { status: 500 }
    );
  }
}

