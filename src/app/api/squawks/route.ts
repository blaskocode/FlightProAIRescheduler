import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRescheduleSuggestions } from '@/lib/services/ai-reschedule-service';
import { sendNotification } from '@/lib/services/notification-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { aircraftId, severity, title, description, reportedBy } = body;

    if (!aircraftId || !severity || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If grounding, cancel all future flights and trigger rescheduling
    let impactedFlightIds: string[] = [];
    if (severity === 'GROUNDING') {
      await prisma.aircraft.update({
        where: { id: aircraftId },
        data: { status: 'GROUNDED' },
      });

      const impactedFlights = await prisma.flight.findMany({
        where: {
          aircraftId,
          scheduledStart: { gte: new Date() },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        include: {
          student: true,
        },
      });

      impactedFlightIds = impactedFlights.map((f) => f.id);

      // Cancel flights
      await prisma.flight.updateMany({
        where: {
          id: { in: impactedFlightIds },
        },
        data: {
          status: 'MAINTENANCE_CANCELLED',
        },
      });

      // Trigger AI rescheduling for each cancelled flight
      for (const flight of impactedFlights) {
        try {
          // Generate AI reschedule suggestions
          const rescheduleResponse = await generateRescheduleSuggestions(flight.id);

          // Create reschedule request
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 48);

          const rescheduleRequest = await prisma.rescheduleRequest.create({
            data: {
              flightId: flight.id,
              studentId: flight.studentId,
              suggestions: rescheduleResponse.suggestions as any,
              aiReasoning: rescheduleResponse.priorityFactors as any,
              status: 'PENDING_STUDENT',
              expiresAt,
            },
          });

          // Notify affected student
          await sendNotification({
            recipientId: flight.studentId,
            type: 'MAINTENANCE_ALERT',
            subject: 'Aircraft Maintenance - Flight Cancelled',
            message: `Your flight on ${new Date(flight.scheduledStart).toLocaleDateString()} has been cancelled due to aircraft maintenance. Reschedule options are available in your dashboard.`,
            flightId: flight.id,
            metadata: {
              rescheduleRequestId: rescheduleRequest.id,
              squawkId: 'pending', // Will be updated after squawk is created
            },
          });
        } catch (error) {
          console.error(`Error triggering reschedule for flight ${flight.id}:`, error);
          // Continue with other flights even if one fails
        }
      }
    }

    const squawk = await prisma.squawk.create({
      data: {
        aircraftId,
        reportedBy: reportedBy || 'system',
        severity,
        title,
        description,
        impactedFlightIds: impactedFlightIds.length > 0 ? impactedFlightIds : undefined,
        status: 'OPEN',
      },
    });

    return NextResponse.json(squawk, { status: 201 });
  } catch (error) {
    console.error('Error creating squawk:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const squawks = await prisma.squawk.findMany({
      where,
      include: {
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
      },
      orderBy: {
        reportedAt: 'desc',
      },
    });

    return NextResponse.json(squawks);
  } catch (error) {
    console.error('Error fetching squawks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

