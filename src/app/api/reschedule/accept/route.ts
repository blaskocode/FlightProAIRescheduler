import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/reschedule/accept
 * Create a reschedule request and accept it (for student confirmation)
 * This endpoint creates the request if it doesn't exist, then processes the acceptance
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const { flightId, selectedOption, suggestions, priorityFactors } = body;

    if (!flightId || selectedOption === undefined) {
      return NextResponse.json(
        { error: 'Flight ID and selected option are required' },
        { status: 400 }
      );
    }

    // Get flight to verify it exists and get studentId
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      select: {
        id: true,
        studentId: true,
        status: true,
      },
    });

    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    // Verify user is the student for this flight
    if (authUser.studentId !== flight.studentId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if there's already a pending reschedule request
    const existingRequest = await prisma.rescheduleRequest.findFirst({
      where: {
        flightId: flight.id,
        status: { in: ['PENDING_STUDENT', 'PENDING_INSTRUCTOR'] },
      },
    });

    let rescheduleRequest;
    
    if (existingRequest) {
      // Use existing request
      rescheduleRequest = existingRequest;
    } else {
      // Create new reschedule request
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiration

      rescheduleRequest = await prisma.rescheduleRequest.create({
        data: {
          flightId: flight.id,
          studentId: flight.studentId,
          suggestions: suggestions || [],
          aiReasoning: priorityFactors || {},
          status: 'PENDING_STUDENT',
          expiresAt,
        },
      });
    }

    // Parse suggestions
    const parsedSuggestions = Array.isArray(rescheduleRequest.suggestions)
      ? rescheduleRequest.suggestions
      : JSON.parse((rescheduleRequest.suggestions as any) || '[]');
    
    const selected = parsedSuggestions[selectedOption];

    if (!selected) {
      return NextResponse.json(
        { error: 'Invalid option selected' },
        { status: 400 }
      );
    }

    // Update original flight to RESCHEDULE_PENDING
    await prisma.flight.update({
      where: { id: flight.id },
      data: {
        status: 'RESCHEDULE_PENDING',
      },
    });

    // Update reschedule request with student's selection
    await prisma.rescheduleRequest.update({
      where: { id: rescheduleRequest.id },
      data: {
        selectedOption,
        selectedBy: 'student',
        studentConfirmedAt: new Date(),
        status: 'PENDING_INSTRUCTOR',
      },
    });

    return NextResponse.json({
      success: true,
      rescheduleRequestId: rescheduleRequest.id,
      message: 'Reschedule request submitted! Waiting for instructor confirmation.',
    });
  } catch (error: any) {
    console.error('Error accepting reschedule:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

