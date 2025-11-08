import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRescheduleSuggestions } from '@/lib/services/ai-reschedule-service';

/**
 * POST /api/flights/:id/reschedule
 * Manually request rescheduling for a flight (triggers AI rescheduling)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flight = await prisma.flight.findUnique({
      where: { id: params.id },
      include: {
        student: true,
      },
    });

    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    // Cannot reschedule certain statuses
    if (['COMPLETED', 'RESCHEDULED', 'WEATHER_CANCELLED', 'MAINTENANCE_CANCELLED'].includes(flight.status)) {
      return NextResponse.json(
        { error: `Cannot reschedule flight with status: ${flight.status}` },
        { status: 409 }
      );
    }

    // Check if there's already a pending reschedule request
    const existingRequest = await prisma.rescheduleRequest.findFirst({
      where: {
        flightId: params.id,
        status: { in: ['PENDING_STUDENT', 'PENDING_INSTRUCTOR'] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A reschedule request is already pending for this flight', rescheduleRequestId: existingRequest.id },
        { status: 409 }
      );
    }

    // Generate AI reschedule suggestions
    const suggestions = await generateRescheduleSuggestions(params.id);

    // Create reschedule request
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiration

    const rescheduleRequest = await prisma.rescheduleRequest.create({
      data: {
        flightId: flight.id,
        studentId: flight.studentId,
        suggestions: suggestions.suggestions as any,
        aiReasoning: suggestions.priorityFactors as any,
        status: 'PENDING_STUDENT',
        expiresAt,
      },
      include: {
        flight: {
          select: {
            id: true,
            scheduledStart: true,
            lessonTitle: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      rescheduleRequestId: rescheduleRequest.id,
      suggestions: suggestions.suggestions,
      priorityFactors: suggestions.priorityFactors,
      expiresAt: rescheduleRequest.expiresAt,
    });
  } catch (error: any) {
    console.error('Error creating reschedule request:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

