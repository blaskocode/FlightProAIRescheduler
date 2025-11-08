import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/sms/opt-out
 * Opt out of SMS notifications
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();

    // Update student record
    if (authUser.role === 'student' && authUser.studentId) {
      await prisma.student.update({
        where: { id: authUser.studentId },
        data: {
          smsOptIn: false,
          smsNotifications: false,
        },
      });
    }

    // Update instructor record
    if (authUser.role === 'instructor' && authUser.instructorId) {
      await prisma.instructor.update({
        where: { id: authUser.instructorId },
        data: {
          smsOptIn: false,
          smsNotifications: false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error opting out of SMS:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

