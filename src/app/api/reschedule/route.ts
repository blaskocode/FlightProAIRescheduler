import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const flightId = searchParams.get('flightId');
    const status = searchParams.get('status');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (flightId) where.flightId = flightId;
    if (status) where.status = status;

    const requests = await prisma.rescheduleRequest.findMany({
      where,
      include: {
        flight: {
          select: {
            id: true,
            scheduledStart: true,
            lessonTitle: true,
            status: true,
          },
        },
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching reschedule requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

