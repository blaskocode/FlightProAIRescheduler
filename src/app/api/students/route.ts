import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions/check';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    // Check if user can view students
    const canViewAll = await hasPermission(authUser, 'students.view.all');
    const canViewOwn = await hasPermission(authUser, 'students.view.own');
    
    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const instructorId = searchParams.get('instructorId');
    const schoolId = searchParams.get('schoolId');

    const where: any = {};

    // Get user's school ID if they have one
    let userSchoolId: string | undefined;
    if (authUser.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: authUser.studentId },
        select: { schoolId: true },
      });
      userSchoolId = student?.schoolId;
    } else if (authUser.instructorId) {
      const instructor = await prisma.instructor.findUnique({
        where: { id: authUser.instructorId },
        select: { schoolId: true },
      });
      userSchoolId = instructor?.schoolId;
    }

    // Filter by school if user has one (unless they're super admin)
    if (userSchoolId && authUser.role !== 'super_admin') {
      where.schoolId = userSchoolId;
    }

    // If instructor, show only their students (students who have flights with them)
    if (authUser.role === 'instructor' && authUser.instructorId) {
      const instructorFlights = await prisma.flight.findMany({
        where: {
          instructorId: authUser.instructorId,
        },
        select: {
          studentId: true,
        },
        distinct: ['studentId'],
      });
      
      const studentIds = instructorFlights.map(f => f.studentId).filter(Boolean);
      if (studentIds.length > 0) {
        where.id = { in: studentIds };
      } else {
        // No students found, return empty array
        return NextResponse.json([]);
      }
    }

    if (instructorId) {
      // Find students who have flights with this instructor
      const instructorFlights = await prisma.flight.findMany({
        where: {
          instructorId,
        },
        select: {
          studentId: true,
        },
        distinct: ['studentId'],
      });
      
      const studentIds = instructorFlights.map(f => f.studentId).filter(Boolean);
      if (studentIds.length > 0) {
        where.id = { in: studentIds };
      } else {
        return NextResponse.json([]);
      }
    }

    if (schoolId) {
      where.schoolId = schoolId;
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        schoolId: true,
        firstName: true,
        lastName: true,
        email: true,
        trainingLevel: true,
        currentStage: true,
        lastFlightDate: true,
        preferredInstructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            flights: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED', 'RESCHEDULE_PENDING', 'RESCHEDULE_CONFIRMED'] },
              },
            },
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
      take: 100,
    });

    return NextResponse.json(students);
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}

