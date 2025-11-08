import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateBooking, cancelBooking } from '@/lib/services/booking-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flight = await prisma.flight.findUnique({
      where: { id: params.id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            trainingLevel: true,
            currentStage: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            airportCode: true,
          },
        },
        weatherChecks: {
          orderBy: {
            checkTime: 'desc',
          },
          take: 5,
        },
        rescheduleRequests: {
          where: {
            status: { in: ['PENDING_STUDENT', 'PENDING_INSTRUCTOR'] },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(flight);
  } catch (error) {
    console.error('Error fetching flight:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      instructorId,
      aircraftId,
      scheduledStart,
      scheduledEnd,
      flightType,
      lessonNumber,
      lessonTitle,
      departureAirport,
      destinationAirport,
      route,
    } = body;

    // Get user ID from request (would come from auth middleware in production)
    const userId = request.headers.get('x-user-id') || undefined;

    const flight = await updateBooking(
      params.id,
      {
        instructorId,
        aircraftId,
        scheduledStart: scheduledStart ? new Date(scheduledStart) : undefined,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : undefined,
        flightType,
        lessonNumber,
        lessonTitle,
        departureAirport,
        destinationAirport,
        route,
      },
      userId
    );

    return NextResponse.json(flight);
  } catch (error: any) {
    console.error('Error updating flight:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error.message.includes('not available') || error.message.includes('Cannot update')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const { reason, userId } = body;

    // Get user ID from request or body
    const cancelUserId = userId || request.headers.get('x-user-id') || undefined;

    // Default reason if not provided
    const cancelReason = reason || 'STUDENT_CANCELLED';

    await cancelBooking(params.id, cancelReason as any, cancelUserId);

    return NextResponse.json({ success: true, message: 'Flight cancelled successfully' });
  } catch (error: any) {
    console.error('Error cancelling flight:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error.message.includes('Cannot cancel') || error.message.includes('already')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

