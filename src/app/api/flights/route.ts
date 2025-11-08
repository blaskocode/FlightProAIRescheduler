import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createBooking } from '@/lib/services/booking-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const instructorId = searchParams.get('instructorId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (studentId) where.studentId = studentId;
    if (instructorId) where.instructorId = instructorId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.scheduledStart = {};
      if (startDate) where.scheduledStart.gte = new Date(startDate);
      if (endDate) where.scheduledStart.lte = new Date(endDate);
    }

    const flights = await prisma.flight.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        aircraft: {
          include: {
            aircraftType: true,
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    return NextResponse.json(flights);
  } catch (error) {
    console.error('Error fetching flights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolId,
      studentId,
      instructorId,
      aircraftId,
      scheduledStart,
      scheduledEnd,
      flightType,
      lessonNumber,
      lessonTitle,
      departureAirport,
      destinationAirport,
      route,
    } = body;

    // Get user ID from request (would come from auth middleware in production)
    const userId = request.headers.get('x-user-id') || undefined;

    // Use booking service for centralized logic with transaction handling
    const flight = await createBooking(
      {
        schoolId,
        studentId,
        instructorId,
        aircraftId,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        flightType,
        lessonNumber,
        lessonTitle,
        departureAirport,
        destinationAirport,
        route,
      },
      userId
    );

    return NextResponse.json(flight, { status: 201 });
  } catch (error: any) {
    console.error('Error creating flight:', error);
    
    if (error.message.includes('not available') || error.message.includes('Missing required')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('not available') ? 409 : 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

