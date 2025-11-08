import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/reschedule/:id/reject
 * Reject a reschedule suggestion (student or instructor can reject)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const { reason, rejectedBy } = body;

    const rescheduleRequest = await prisma.rescheduleRequest.findUnique({
      where: { id: params.id },
      include: {
        flight: true,
      },
    });

    if (!rescheduleRequest) {
      return NextResponse.json(
        { error: 'Reschedule request not found' },
        { status: 404 }
      );
    }

    // Cannot reject already processed requests
    if (rescheduleRequest.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Cannot reject an already accepted reschedule request' },
        { status: 409 }
      );
    }

    if (rescheduleRequest.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Reschedule request is already rejected' },
        { status: 409 }
      );
    }

    if (rescheduleRequest.status === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Cannot reject an expired reschedule request' },
        { status: 409 }
      );
    }

    // Update reschedule request status
    await prisma.rescheduleRequest.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'No reason provided',
      },
    });

    // If flight was cancelled due to weather/maintenance, restore to original status
    // (This is optional - you might want to keep it cancelled)
    if (rescheduleRequest.flight.status === 'WEATHER_CANCELLED' || rescheduleRequest.flight.status === 'MAINTENANCE_CANCELLED') {
      // Optionally restore flight status - commented out for now
      // await prisma.flight.update({
      //   where: { id: rescheduleRequest.flightId },
      //   data: { status: 'SCHEDULED' },
      // });
    }

    return NextResponse.json({
      success: true,
      message: 'Reschedule request rejected',
      rescheduleRequestId: params.id,
    });
  } catch (error: any) {
    console.error('Error rejecting reschedule request:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

