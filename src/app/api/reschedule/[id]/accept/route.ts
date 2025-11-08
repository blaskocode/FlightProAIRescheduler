import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { selectedOption, confirmedBy } = body; // "student" or "instructor"

    const rescheduleRequest = await prisma.rescheduleRequest.findUnique({
      where: { id: params.id },
      include: {
        flight: true,
        student: true,
      },
    });

    if (!rescheduleRequest) {
      return NextResponse.json(
        { error: 'Reschedule request not found' },
        { status: 404 }
      );
    }

    if (rescheduleRequest.status === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Reschedule request has expired' },
        { status: 400 }
      );
    }

    const suggestions = rescheduleRequest.suggestions as any[];
    const selected = suggestions[selectedOption];

    if (!selected) {
      return NextResponse.json(
        { error: 'Invalid option selected' },
        { status: 400 }
      );
    }

    // Update reschedule request
    if (confirmedBy === 'student') {
      await prisma.rescheduleRequest.update({
        where: { id: params.id },
        data: {
          selectedOption,
          selectedBy: 'student',
          studentConfirmedAt: new Date(),
          status: 'PENDING_INSTRUCTOR',
        },
      });
    } else if (confirmedBy === 'instructor') {
      // Create new flight
      const newFlight = await prisma.flight.create({
        data: {
          schoolId: rescheduleRequest.flight.schoolId,
          studentId: rescheduleRequest.studentId,
          instructorId: selected.instructorId,
          aircraftId: selected.aircraftId,
          scheduledStart: new Date(selected.slot),
          scheduledEnd: new Date(new Date(selected.slot).getTime() + 2 * 60 * 60 * 1000), // 2 hours
          briefingStart: new Date(new Date(selected.slot).getTime() - 30 * 60 * 1000),
          debriefEnd: new Date(new Date(selected.slot).getTime() + 2 * 60 * 60 * 1000 + 20 * 60 * 1000),
          flightType: rescheduleRequest.flight.flightType,
          lessonNumber: rescheduleRequest.flight.lessonNumber,
          lessonTitle: rescheduleRequest.flight.lessonTitle,
          departureAirport: rescheduleRequest.flight.departureAirport,
          destinationAirport: rescheduleRequest.flight.destinationAirport,
          route: rescheduleRequest.flight.route,
          status: 'CONFIRMED',
          rescheduledFromId: rescheduleRequest.flightId,
        },
      });

      // Update original flight
      await prisma.flight.update({
        where: { id: rescheduleRequest.flightId },
        data: {
          status: 'RESCHEDULED',
        },
      });

      // Update reschedule request
      await prisma.rescheduleRequest.update({
        where: { id: params.id },
        data: {
          instructorConfirmedAt: new Date(),
          status: 'ACCEPTED',
          newFlightId: newFlight.id,
        },
      });

      return NextResponse.json({
        success: true,
        newFlight,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error accepting reschedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

