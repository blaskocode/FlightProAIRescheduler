import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCalendarConflicts, refreshAccessToken } from '@/lib/services/google-calendar-service';

/**
 * POST /api/calendar/conflicts
 * Check for conflicts between flight times and Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Get user's calendar sync config
    const userId = authUser.studentId || authUser.instructorId || '';
    const syncConfig = await prisma.googleCalendarSync.findUnique({
      where: { userId },
    });

    if (!syncConfig || !syncConfig.syncEnabled) {
      return NextResponse.json(
        { error: 'Google Calendar sync not enabled' },
        { status: 400 }
      );
    }

    // Check if token needs refresh
    let accessToken = syncConfig.accessToken;
    if (new Date(syncConfig.tokenExpiresAt) < new Date()) {
      accessToken = await refreshAccessToken(syncConfig.refreshToken);
      
      await prisma.googleCalendarSync.update({
        where: { id: syncConfig.id },
        data: {
          accessToken,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });
    }

    // Check for conflicts
    const conflicts = await checkCalendarConflicts(
      {
        accessToken,
        refreshToken: syncConfig.refreshToken,
        calendarId: syncConfig.calendarId,
        syncEnabled: syncConfig.syncEnabled,
      },
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({ conflicts });
  } catch (error: any) {
    console.error('Error checking calendar conflicts:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

