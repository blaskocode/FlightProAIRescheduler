import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/squawks/:id/resolve
 * Resolve a squawk (mark as resolved and re-enable aircraft if it was grounded)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { resolutionNotes, maintenanceLog, actualCost } = body;

    const squawk = await prisma.squawk.findUnique({
      where: { id: params.id },
      include: {
        aircraft: true,
      },
    });

    if (!squawk) {
      return NextResponse.json(
        { error: 'Squawk not found' },
        { status: 404 }
      );
    }

    if (squawk.status === 'RESOLVED') {
      return NextResponse.json(
        { error: 'Squawk is already resolved' },
        { status: 409 }
      );
    }

    // Update squawk to resolved
    const updated = await prisma.squawk.update({
      where: { id: params.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes || squawk.resolutionNotes,
        maintenanceLog: maintenanceLog || squawk.maintenanceLog,
        actualCost: actualCost !== undefined ? actualCost : squawk.actualCost,
      },
      include: {
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
      },
    });

    // If this was a grounding squawk, re-enable the aircraft
    if (squawk.severity === 'GROUNDING' && squawk.aircraft.status === 'GROUNDED') {
      await prisma.aircraft.update({
        where: { id: squawk.aircraftId },
        data: { status: 'AVAILABLE' },
      });

      // Update the squawk's aircraft status in the response
      updated.aircraft.status = 'AVAILABLE';
    }

    return NextResponse.json({
      success: true,
      squawk: updated,
      message: 'Squawk resolved successfully',
      aircraftReEnabled: squawk.severity === 'GROUNDING',
    });
  } catch (error: any) {
    console.error('Error resolving squawk:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

