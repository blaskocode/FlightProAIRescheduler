import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getUserSchoolId } from '@/lib/auth/school-scope';

/**
 * GET /api/analytics/rescheduling-time
 * Calculate average rescheduling time from conflict detection to confirmation
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId') || await getUserSchoolId(authUser);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Find all accepted reschedule requests with timestamps
    const rescheduleRequests = await prisma.rescheduleRequest.findMany({
      where: {
        status: 'ACCEPTED',
        createdAt: {
          gte: start,
          lte: end,
        },
        flight: {
          schoolId,
        },
        instructorConfirmedAt: {
          not: null,
        },
      },
      include: {
        flight: {
          select: {
            id: true,
            schoolId: true,
          },
        },
      },
    });

    // Calculate rescheduling times
    const reschedulingTimes: number[] = [];
    let totalTime = 0;
    let count = 0;

    for (const request of rescheduleRequests) {
      if (!request.instructorConfirmedAt) continue;

      // Time from request creation (conflict detection) to instructor confirmation
      const timeMs = request.instructorConfirmedAt.getTime() - request.createdAt.getTime();
      const timeHours = timeMs / (1000 * 60 * 60); // Convert to hours

      reschedulingTimes.push(timeHours);
      totalTime += timeHours;
      count++;
    }

    // Also check weather check time to reschedule request creation
    // This gives us time from weather conflict detection to reschedule request
    const weatherChecks = await prisma.weatherCheck.findMany({
      where: {
        result: 'UNSAFE',
        checkTime: {
          gte: start,
          lte: end,
        },
        flight: {
          schoolId,
          rescheduleRequests: {
            some: {
              status: 'ACCEPTED',
              instructorConfirmedAt: {
                not: null,
              },
            },
          },
        },
      },
      include: {
        flight: {
          select: {
            id: true,
            rescheduleRequests: {
              where: {
                status: 'ACCEPTED',
                instructorConfirmedAt: {
                  not: null,
                },
              },
              select: {
                createdAt: true,
                instructorConfirmedAt: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Calculate time from weather check to final confirmation
    const fullCycleTimes: number[] = [];
    for (const check of weatherChecks) {
      const request = check.flight.rescheduleRequests[0];
      if (!request || !request.instructorConfirmedAt) continue;

      const timeMs = request.instructorConfirmedAt.getTime() - check.checkTime.getTime();
      const timeHours = timeMs / (1000 * 60 * 60);
      fullCycleTimes.push(timeHours);
    }

    const avgReschedulingTime = count > 0 ? totalTime / count : 0;
    const avgFullCycleTime = fullCycleTimes.length > 0
      ? fullCycleTimes.reduce((a, b) => a + b, 0) / fullCycleTimes.length
      : 0;

    // Calculate percentiles
    const sortedTimes = reschedulingTimes.sort((a, b) => a - b);
    const p50 = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length * 0.5)] : 0;
    const p75 = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length * 0.75)] : 0;
    const p95 = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length * 0.95)] : 0;

    return NextResponse.json({
      avgReschedulingTime: Math.round(avgReschedulingTime * 100) / 100, // Round to 2 decimals
      avgFullCycleTime: Math.round(avgFullCycleTime * 100) / 100,
      count,
      percentiles: {
        p50: Math.round(p50 * 100) / 100,
        p75: Math.round(p75 * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
      },
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error calculating rescheduling time:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

