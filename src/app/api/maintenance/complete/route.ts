import { NextRequest, NextResponse } from 'next/server';
import { completeMaintenance } from '@/lib/services/maintenance-scheduling-service';

/**
 * POST /api/maintenance/complete
 * Mark maintenance as complete and release aircraft
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      aircraftId,
      maintenanceType,
      completedDate,
      completedHobbs,
      cost,
      notes,
      performedBy,
    } = body;

    if (!aircraftId || !maintenanceType || !completedDate || completedHobbs === undefined) {
      return NextResponse.json(
        { error: 'aircraftId, maintenanceType, completedDate, and completedHobbs are required' },
        { status: 400 }
      );
    }

    await completeMaintenance(
      aircraftId,
      maintenanceType,
      new Date(completedDate),
      completedHobbs,
      cost || null,
      notes || null,
      performedBy || null
    );

    return NextResponse.json({
      success: true,
      message: 'Maintenance completed and aircraft released',
    });
  } catch (error: any) {
    console.error('Error completing maintenance:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

