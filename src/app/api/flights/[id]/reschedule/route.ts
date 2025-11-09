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

    // Don't create reschedule request yet - only return suggestions
    // The request will be created when user clicks "Select Option"
    // This allows users to view options without committing to a reschedule

    return NextResponse.json({
      suggestions: suggestions.suggestions,
      priorityFactors: suggestions.priorityFactors,
    });
  } catch (error: any) {
    console.error('Error creating reschedule request:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

