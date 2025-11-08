import { NextRequest, NextResponse } from 'next/server';
import { generateRescheduleSuggestions } from '@/lib/services/ai-reschedule-service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightId } = body;

    if (!flightId) {
      return NextResponse.json(
        { error: 'Flight ID required' },
        { status: 400 }
      );
    }

    // Generate AI suggestions
    const suggestions = await generateRescheduleSuggestions(flightId);

    // Create reschedule request in database
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      include: { student: true },
    });

    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const rescheduleRequest = await prisma.rescheduleRequest.create({
      data: {
        flightId: flight.id,
        studentId: flight.studentId,
        suggestions: suggestions.suggestions as any,
        aiReasoning: suggestions.priorityFactors as any,
        expiresAt,
      },
    });

    return NextResponse.json({
      rescheduleRequestId: rescheduleRequest.id,
      suggestions: suggestions.suggestions,
      priorityFactors: suggestions.priorityFactors,
    });
  } catch (error: any) {
    console.error('Error generating reschedule suggestions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

