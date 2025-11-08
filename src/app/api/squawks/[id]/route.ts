import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/squawks/:id
 * Update squawk status (e.g., assign to maintenance, change status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, assignedTo, estimatedCost, resolutionNotes } = body;

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

    // Update squawk
    const updated = await prisma.squawk.update({
      where: { id: params.id },
      data: {
        ...(status && { status: status as any }),
        ...(assignedTo && { assignedTo }),
        ...(estimatedCost !== undefined && { estimatedCost }),
        ...(resolutionNotes && { resolutionNotes }),
      },
      include: {
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating squawk:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

