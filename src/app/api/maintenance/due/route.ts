import { NextRequest, NextResponse } from 'next/server';
import { getAircraftDueForMaintenance } from '@/lib/services/maintenance-scheduling-service';

/**
 * GET /api/maintenance/due
 * Get all aircraft due for maintenance
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId') || undefined;
    const thresholdDays = parseInt(searchParams.get('thresholdDays') || '30');

    const schedules = await getAircraftDueForMaintenance(schoolId, thresholdDays);

    return NextResponse.json({
      schedules,
      count: schedules.length,
    });
  } catch (error: any) {
    console.error('Error fetching maintenance due:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

