import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateRescheduleSuggestions } from '@/lib/services/ai-reschedule-service';
import { sendNotification } from '@/lib/services/notification-service';

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
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
      // Check current aircraft status
      const aircraft = await prisma.aircraft.findUnique({
        where: { id: aircraftId },
        select: { status: true },
      });

      // Only update status if not already grounded
      if (aircraft?.status !== 'GROUNDED') {
        await prisma.aircraft.update({
          where: { id: aircraftId },
          data: { status: 'GROUNDED' },
        });
      }

      const impactedFlights = await prisma.flight.findMany({
        where: {
          aircraftId,
          scheduledStart: { gte: new Date() },
          status: { in: ['PENDING', 'CONFIRMED', 'RESCHEDULE_PENDING', 'RESCHEDULE_CONFIRMED'] },
        },
        select: {
          id: true,
          studentId: true,
          scheduledStart: true,
          student: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      impactedFlightIds = impactedFlights.map((f) => f.id);

      // Cancel flights if there are any
      if (impactedFlightIds.length > 0) {
        await prisma.flight.updateMany({
          where: {
            id: { in: impactedFlightIds },
          },
          data: {
            status: 'MAINTENANCE_CANCELLED',
          },
        });

        // Trigger AI rescheduling for each cancelled flight (non-blocking)
        // Process in parallel with timeout to prevent hanging
        const reschedulePromises = impactedFlights.map(async (flight) => {
          try {
            // Set a timeout for AI generation (30 seconds max)
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Reschedule generation timeout')), 30000)
            );

            const reschedulePromise = (async () => {
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

              // Notify affected student (non-blocking)
              sendNotification({
                recipientId: flight.studentId,
                type: 'MAINTENANCE_ALERT',
                subject: 'Aircraft Maintenance - Flight Cancelled',
                message: `Your flight on ${new Date(flight.scheduledStart).toLocaleDateString()} has been cancelled due to aircraft maintenance. Reschedule options are available in your dashboard.`,
                flightId: flight.id,
                metadata: {
                  rescheduleRequestId: rescheduleRequest.id,
                  squawkId: 'pending', // Will be updated after squawk is created
                },
              }).catch(err => {
                console.error(`Error sending notification for flight ${flight.id}:`, err);
              });

              return rescheduleRequest;
            })();

            await Promise.race([reschedulePromise, timeoutPromise]);
          } catch (error) {
            console.error(`Error triggering reschedule for flight ${flight.id}:`, error);
            // Continue with other flights even if one fails
          }
        });

        // Don't wait for all reschedules to complete - create squawk immediately
        // Reschedules will continue in background
        Promise.all(reschedulePromises).catch(err => {
          console.error('Error in background reschedule processing:', err);
        });
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
  } catch (error: any) {
    console.error('Error creating squawk:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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

