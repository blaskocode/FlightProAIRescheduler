import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    let preferences = null;

    if (authUser.role === 'student' && authUser.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: authUser.studentId },
        select: { notificationPreferences: true },
      });
      preferences = student?.notificationPreferences || getDefaultPreferences();
    } else if (authUser.role === 'instructor' && authUser.instructorId) {
      const instructor = await prisma.instructor.findUnique({
        where: { id: authUser.instructorId },
        select: { notificationPreferences: true },
      });
      preferences = instructor?.notificationPreferences || getDefaultPreferences();
    } else if (authUser.role === 'admin' && authUser.adminId) {
      const admin = await prisma.admin.findUnique({
        where: { id: authUser.adminId },
        select: { notificationPreferences: true },
      });
      preferences = admin?.notificationPreferences || getDefaultPreferences();
    }

    return NextResponse.json({ preferences });
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences are required' },
        { status: 400 }
      );
    }

    if (authUser.role === 'student' && authUser.studentId) {
      await prisma.student.update({
        where: { id: authUser.studentId },
        data: { notificationPreferences: preferences },
      });
    } else if (authUser.role === 'instructor' && authUser.instructorId) {
      await prisma.instructor.update({
        where: { id: authUser.instructorId },
        data: { notificationPreferences: preferences },
      });
    } else if (authUser.role === 'admin' && authUser.adminId) {
      await prisma.admin.update({
        where: { id: authUser.adminId },
        data: { notificationPreferences: preferences },
      });
    } else {
      return NextResponse.json(
        { error: 'User role not found' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, preferences });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function getDefaultPreferences() {
  return {
    channels: {
      email: true,
      sms: false,
      push: true,
    },
    timing: {
      immediate: true,
      dailyDigest: false,
      weeklyDigest: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
    },
    eventTypes: {
      weather: {
        email: true,
        sms: false,
        push: true,
      },
      reschedule: {
        email: true,
        sms: true,
        push: true,
      },
      confirmation: {
        email: true,
        sms: false,
        push: true,
      },
      currency: {
        email: true,
        sms: false,
        push: false,
      },
      maintenance: {
        email: true,
        sms: false,
        push: false,
      },
    },
  };
}

