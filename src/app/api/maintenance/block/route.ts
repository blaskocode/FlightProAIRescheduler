import { NextRequest, NextResponse } from 'next/server';
import { blockAircraftForMaintenance } from '@/lib/services/maintenance-scheduling-service';

/**
 * POST /api/maintenance/block
 * Block aircraft for scheduled maintenance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { aircraftId, maintenanceType, scheduledDate, estimatedDurationHours } = body;

    if (!aircraftId || !maintenanceType || !scheduledDate) {
      return NextResponse.json(
        { error: 'aircraftId, maintenanceType, and scheduledDate are required' },
        { status: 400 }
      );
    }

    await blockAircraftForMaintenance(
      aircraftId,
      maintenanceType,
      new Date(scheduledDate),
      estimatedDurationHours || 8
    );

    return NextResponse.json({
      success: true,
      message: 'Aircraft blocked for maintenance',
    });
  } catch (error: any) {
    console.error('Error blocking aircraft:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

