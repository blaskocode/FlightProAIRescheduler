import { NextRequest, NextResponse } from 'next/server';
import { calculateMaintenanceSchedule } from '@/lib/services/maintenance-scheduling-service';

/**
 * GET /api/maintenance/schedule/:aircraftId
 * Get maintenance schedule for an aircraft
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { aircraftId: string } }
) {
  try {
    const schedules = await calculateMaintenanceSchedule(params.aircraftId);
    return NextResponse.json({ schedules });
  } catch (error: any) {
    console.error('Error calculating maintenance schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

