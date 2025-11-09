import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    
    // Get user's school ID
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

    // Admins and super_admins can see all aircraft (no schoolId required)
    // Students and instructors need a schoolId
    if (!userSchoolId && authUser.role !== 'admin' && authUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'User has no school assigned' },
        { status: 400 }
      );
    }

    const where: any = {};
    // Only filter by school if user has one and is not an admin
    if (userSchoolId && authUser.role !== 'admin' && authUser.role !== 'super_admin') {
      where.schoolId = userSchoolId;
    }

    const aircraft = await prisma.aircraft.findMany({
      where,
      select: {
        id: true,
        tailNumber: true,
        status: true,
        aircraftType: {
          select: {
            make: true,
            model: true,
          },
        },
      },
      orderBy: {
        tailNumber: 'asc',
      },
    });

    return NextResponse.json(aircraft);
  } catch (error: any) {
    console.error('Error fetching aircraft:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}

