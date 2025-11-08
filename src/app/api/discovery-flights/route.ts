import { NextRequest, NextResponse } from 'next/server';
import { createDiscoveryFlightBooking, getDiscoveryFlightMetrics } from '@/lib/services/discovery-flight-service';

/**
 * POST /api/discovery-flights
 * Create a discovery flight booking (public endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, schoolId, preferredDate, preferredTime, notes } = body;

    if (!firstName || !lastName || !email || !phone || !schoolId || !preferredDate) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, phone, schoolId, preferredDate' },
        { status: 400 }
      );
    }

    const result = await createDiscoveryFlightBooking({
      firstName,
      lastName,
      email,
      phone,
      schoolId,
      preferredDate: new Date(preferredDate),
      preferredTime,
      notes,
    });

    return NextResponse.json({
      success: true,
      flight: result.flight,
      discoveryRecord: result.discoveryRecord,
    });
  } catch (error: any) {
    console.error('Error creating discovery flight:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/discovery-flights
 * Get discovery flight metrics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId is required' },
        { status: 400 }
      );
    }

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); // Default to 90 days

    const metrics = await getDiscoveryFlightMetrics(schoolId, startDate, endDate);

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error fetching discovery flight metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

