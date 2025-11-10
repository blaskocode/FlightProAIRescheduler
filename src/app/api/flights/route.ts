import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createBooking } from '@/lib/services/booking-service';
import { requireAuth } from '@/lib/auth';
import { hasPermission, canViewFlight } from '@/lib/permissions/check';
import { auditLog } from '@/lib/audit/audit-log';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    console.log('Auth user:', { role: authUser.role, studentId: authUser.studentId, instructorId: authUser.instructorId });
    
    // Check if user can view flights
    const canViewAll = await hasPermission(authUser, 'flights.view.all');
    const canViewOwn = await hasPermission(authUser, 'flights.view.own');
    console.log('Permissions:', { canViewAll, canViewOwn });

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const instructorId = searchParams.get('instructorId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    // Get user's school ID if they have one (for multi-school support)
    // Students and instructors belong to a school
    let userSchoolId: string | undefined;
    if (authUser.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: authUser.studentId },
        select: { schoolId: true },
      });
      userSchoolId = student?.schoolId;
      console.log('Student schoolId:', userSchoolId);
    } else if (authUser.instructorId) {
      const instructor = await prisma.instructor.findUnique({
        where: { id: authUser.instructorId },
        select: { schoolId: true },
      });
      userSchoolId = instructor?.schoolId;
      console.log('Instructor schoolId:', userSchoolId);
    }

    // Filter by school if user has one
    if (userSchoolId) {
      where.schoolId = userSchoolId;
    } else if (authUser.role !== 'admin') {
      // Non-admin users should have a school
      console.warn('User has no schoolId - this may cause issues');
    }

    // Always filter by role-specific ownership (unless admin)
    // Instructors should ONLY see their own flights
    // Students should ONLY see their own flights
    // Admins can see all flights
    if (authUser.role === 'student' && authUser.studentId) {
      // Students always see only their own flights
      where.studentId = authUser.studentId;
    } else if (authUser.role === 'instructor' && authUser.instructorId) {
      // Instructors always see only their own flights
      where.instructorId = authUser.instructorId;
    }
    // Admins can see all flights (no filtering)

    // Allow query params to further filter (but don't override role-based filtering)
    // These are for admin use cases where they want to filter by specific student/instructor
    if (studentId && authUser.role === 'admin') {
      where.studentId = studentId;
    }
    if (instructorId && authUser.role === 'admin') {
      where.instructorId = instructorId;
    }
    if (status) {
      where.status = status;
    } else {
      // By default, exclude RESCHEDULED flights (they've been replaced by new confirmed flights)
      // Only show them if explicitly requested via status query param
      where.status = { not: 'RESCHEDULED' };
    }
    if (startDate || endDate) {
      where.scheduledStart = {};
      if (startDate) where.scheduledStart.gte = new Date(startDate);
      if (endDate) where.scheduledStart.lte = new Date(endDate);
    }

    console.log('Query where clause:', JSON.stringify(where, null, 2));
    
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

    console.log(`Found ${flights.length} flights for user ${authUser.role}`);
    return NextResponse.json(flights);
  } catch (error: any) {
    console.error('Error fetching flights:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    // Check if user can create flights
    if (!(await hasPermission(authUser, 'flights.create'))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

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
      authUser.uid
    );

    // Audit log
    await auditLog(
      authUser,
      'flight.created',
      'flight',
      {
        resourceId: flight.id,
        schoolId,
        metadata: {
          studentId,
          instructorId,
          aircraftId,
          scheduledStart,
        },
        request: request as any,
      }
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
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

