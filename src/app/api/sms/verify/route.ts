import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyPhoneNumber } from '@/lib/services/sms-service';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/sms/verify
 * Verify and opt-in to SMS notifications
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();
    const { phoneNumber, optIn } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Verify phone number
    const verification = await verifyPhoneNumber(phoneNumber);

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Update student record
    if (authUser.role === 'student' && authUser.studentId) {
      await prisma.student.update({
        where: { id: authUser.studentId },
        data: {
          phone: verification.formatted || phoneNumber,
          phoneVerified: true,
          smsOptIn: optIn === true,
          smsNotifications: optIn === true,
        },
      });
    }

    // Update instructor record
    if (authUser.role === 'instructor' && authUser.instructorId) {
      await prisma.instructor.update({
        where: { id: authUser.instructorId },
        data: {
          phone: verification.formatted || phoneNumber,
          phoneVerified: true,
          smsOptIn: optIn === true,
          smsNotifications: optIn === true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      phoneNumber: verification.formatted,
      verified: true,
    });
  } catch (error: any) {
    console.error('Error verifying phone number:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

