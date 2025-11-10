import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/flights/create-test
 * Create test flights for the current user (for development/testing)
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    if (!authUser.studentId && !authUser.instructorId) {
      return NextResponse.json(
        { error: 'User must be a student or instructor' },
        { status: 400 }
      );
    }

    // Get user's school
    let userSchoolId: string;
    let userRecord: any;
    
    if (authUser.studentId) {
      userRecord = await prisma.student.findUnique({
        where: { id: authUser.studentId },
        include: { school: true },
      });
      userSchoolId = userRecord?.schoolId || '';
    } else {
      userRecord = await prisma.instructor.findUnique({
        where: { id: authUser.instructorId! },
        include: { school: true },
      });
      userSchoolId = userRecord?.schoolId || '';
    }

    if (!userRecord || !userSchoolId) {
      return NextResponse.json(
        { error: 'User school not found' },
        { status: 404 }
      );
    }

    // Get available aircraft
    const aircraft = await prisma.aircraft.findFirst({
      where: { 
        schoolId: userSchoolId, 
        status: 'AVAILABLE' 
      },
    });

    if (!aircraft) {
      return NextResponse.json(
        { error: 'No available aircraft found for this school' },
        { status: 404 }
      );
    }

    // Get instructor if user is a student, or get student if user is an instructor
    let instructor = null;
    let student = null;
    
    if (authUser.studentId) {
      instructor = await prisma.instructor.findFirst({
        where: { schoolId: userSchoolId },
      });
      
      if (!instructor) {
        return NextResponse.json(
          { error: 'No instructor found for this school' },
          { status: 404 }
        );
      }
    } else {
      student = await prisma.student.findFirst({
        where: { schoolId: userSchoolId },
      });
      
      if (!student) {
        return NextResponse.json(
          { error: 'No student found for this school' },
          { status: 404 }
        );
      }
    }

    // Create 5 test flights for the next 2 weeks
    const flights = [];
    const now = new Date();
    
    for (let i = 0; i < 5; i++) {
      const flightDate = new Date(now);
      flightDate.setDate(now.getDate() + (i * 3) + 1); // Every 3 days
      flightDate.setHours(10 + (i % 5), 0, 0, 0); // 10 AM, 11 AM, etc.

      const scheduledStart = flightDate;
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setHours(scheduledEnd.getHours() + 2);
      const briefingStart = new Date(scheduledStart);
      briefingStart.setMinutes(briefingStart.getMinutes() - 30);
      const debriefEnd = new Date(scheduledEnd);
      debriefEnd.setMinutes(debriefEnd.getMinutes() + 20);

      const flight = await prisma.flight.create({
        data: {
          schoolId: userSchoolId,
          studentId: authUser.studentId || student!.id,
          instructorId: authUser.studentId ? instructor!.id : authUser.instructorId!,
          aircraftId: aircraft.id,
          scheduledStart,
          scheduledEnd,
          briefingStart,
          debriefEnd,
          flightType: 'DUAL_INSTRUCTION',
          lessonNumber: authUser.studentId ? (userRecord as any).currentLesson || 1 : undefined,
          lessonTitle: 'Flight Lesson',
          departureAirport: userRecord.school.airportCode,
          status: i === 0 ? 'CONFIRMED' : 'PENDING',
        },
      });

      flights.push({
        id: flight.id,
        scheduledStart: flight.scheduledStart,
        scheduledEnd: flight.scheduledEnd,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${flights.length} test flights`,
      flights,
    });
  } catch (error: any) {
    console.error('Error creating test flights:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

