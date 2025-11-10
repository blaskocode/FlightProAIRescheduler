import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const flightId = searchParams.get('flightId');
    const status = searchParams.get('status');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (flightId) where.flightId = flightId;
    if (status) where.status = status;

    // Fetch all matching requests first
    let requests = await prisma.rescheduleRequest.findMany({
      where,
      include: {
        flight: {
          select: {
            id: true,
            scheduledStart: true,
            lessonTitle: true,
            status: true,
            instructorId: true,
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

    // Filter based on user role
    if (authUser.role === 'student') {
      // Students only see their own reschedule requests
      requests = requests.filter(req => req.studentId === authUser.studentId);
    } else if (authUser.role === 'instructor') {
      // Instructors only see reschedule requests where they are the SELECTED instructor
      // (Once a student selects an option, only the NEW instructor should see it)
      requests = requests.filter(req => {
        // For PENDING_INSTRUCTOR status, only show to the NEW instructor (from selected option)
        if (req.status === 'PENDING_INSTRUCTOR') {
          if (req.selectedOption !== null && req.selectedOption !== undefined) {
            const suggestions = Array.isArray(req.suggestions)
              ? req.suggestions
              : JSON.parse((req.suggestions as any) || '[]');
            const selectedOption = suggestions[req.selectedOption];
            return selectedOption?.instructorId === authUser.instructorId;
          }
          return false;
        }
        
        // For other statuses (PENDING_STUDENT, ACCEPTED, etc), show to original instructor
        return req.flight.instructorId === authUser.instructorId;
      });
    }
    // Admins can see all requests (no filtering)

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('Error fetching reschedule requests:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Authentication') ? 401 : 500 }
    );
  }
}

