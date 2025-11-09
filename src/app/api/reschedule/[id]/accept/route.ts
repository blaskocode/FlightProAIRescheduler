import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const { selectedOption, confirmedBy } = body; // "student" or "instructor"

    const rescheduleRequest = await prisma.rescheduleRequest.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        flightId: true,
        studentId: true,
        selectedOption: true,
        status: true,
        suggestions: true,
        flight: {
          select: {
            id: true,
            schoolId: true,
            flightType: true,
            lessonNumber: true,
            lessonTitle: true,
            departureAirport: true,
            destinationAirport: true,
            route: true,
            instructor: {
              select: { id: true },
            },
          },
        },
        student: {
          select: {
            id: true,
            email: true,
          },
        },
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

    // Authorization checks
    if (confirmedBy === 'student') {
      // Verify user is the student
      if (authUser.studentId !== rescheduleRequest.studentId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
      if (rescheduleRequest.status !== 'PENDING_STUDENT') {
        return NextResponse.json(
          { error: 'Reschedule request is not pending student confirmation' },
          { status: 400 }
        );
      }
    } else if (confirmedBy === 'instructor') {
      // Verify user is an instructor
      if (!authUser.instructorId) {
        return NextResponse.json(
          { error: 'Unauthorized - instructor access required' },
          { status: 403 }
        );
      }
      
      if (rescheduleRequest.status !== 'PENDING_INSTRUCTOR') {
        return NextResponse.json(
          { error: 'Reschedule request is not pending instructor confirmation' },
          { status: 400 }
        );
      }
      
      // Check if instructor matches original flight instructor OR selected reschedule option instructor
      const originalFlightInstructorId = rescheduleRequest.flight.instructor?.id;
      const suggestions = Array.isArray(rescheduleRequest.suggestions)
        ? rescheduleRequest.suggestions
        : JSON.parse((rescheduleRequest.suggestions as any) || '[]');
      const selectedOption = rescheduleRequest.selectedOption;
      const selectedSuggestion = selectedOption !== null && selectedOption !== undefined
        ? suggestions[selectedOption]
        : null;
      const selectedInstructorId = selectedSuggestion?.instructorId;
      
      // Allow if instructor matches original flight instructor OR selected reschedule option instructor
      if (authUser.instructorId !== originalFlightInstructorId && 
          authUser.instructorId !== selectedInstructorId) {
        return NextResponse.json(
          { error: 'Unauthorized - you are not the instructor for this flight' },
          { status: 403 }
        );
      }
    }

    // Parse suggestions (they're stored as JSON)
    const suggestions = Array.isArray(rescheduleRequest.suggestions)
      ? rescheduleRequest.suggestions
      : JSON.parse((rescheduleRequest.suggestions as any) || '[]');
    
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid suggestions data' },
        { status: 400 }
      );
    }
    
    // For instructor confirmation, use the student's selected option
    // For student confirmation, use the provided selectedOption
    const optionToUse = confirmedBy === 'instructor' 
      ? rescheduleRequest.selectedOption 
      : selectedOption;
    
    if (optionToUse === null || optionToUse === undefined) {
      return NextResponse.json(
        { error: 'No option selected' },
        { status: 400 }
      );
    }
    
    const selected = suggestions[optionToUse];

    if (!selected) {
      return NextResponse.json(
        { error: 'Invalid option selected' },
        { status: 400 }
      );
    }

    // Update reschedule request
    if (confirmedBy === 'student') {
      // Update original flight to RESCHEDULE_PENDING
      await prisma.flight.update({
        where: { id: rescheduleRequest.flightId },
        data: {
          status: 'RESCHEDULE_PENDING',
        },
      });

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
      // Validate required fields
      if (!selected.instructorId || !selected.aircraftId || !selected.slot) {
        return NextResponse.json(
          { error: 'Invalid reschedule option: missing required fields' },
          { status: 400 }
        );
      }
      
      if (!rescheduleRequest.flight.schoolId) {
        return NextResponse.json(
          { error: 'Flight missing schoolId' },
          { status: 400 }
        );
      }
      
      // Create new flight with RESCHEDULE_CONFIRMED status
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
          flightType: rescheduleRequest.flight.flightType || 'TRAINING',
          lessonNumber: rescheduleRequest.flight.lessonNumber,
          lessonTitle: rescheduleRequest.flight.lessonTitle || 'Flight Lesson',
          departureAirport: rescheduleRequest.flight.departureAirport || 'KAUS',
          destinationAirport: rescheduleRequest.flight.destinationAirport,
          route: rescheduleRequest.flight.route,
          status: 'RESCHEDULE_CONFIRMED',
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
  } catch (error: any) {
    console.error('Error accepting reschedule:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

