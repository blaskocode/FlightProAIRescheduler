import { NextRequest, NextResponse } from 'next/server';
import { getMaintenanceHistory } from '@/lib/services/maintenance-scheduling-service';

/**
 * GET /api/maintenance/history/:aircraftId
 * Get maintenance history for an aircraft
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { aircraftId: string } }
) {
  try {
    const history = await getMaintenanceHistory(params.aircraftId);
    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Error fetching maintenance history:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

