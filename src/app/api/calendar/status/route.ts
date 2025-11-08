import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/calendar/status
 * Get Google Calendar sync status
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const userId = authUser.studentId || authUser.instructorId || '';

    const syncConfig = await prisma.googleCalendarSync.findUnique({
      where: { userId },
    });

    if (!syncConfig) {
      return NextResponse.json({
        connected: false,
        syncEnabled: false,
      });
    }

    return NextResponse.json({
      connected: true,
      syncEnabled: syncConfig.syncEnabled,
      syncDirection: syncConfig.syncDirection,
      calendarId: syncConfig.calendarId,
      lastSyncAt: syncConfig.lastSyncAt,
      lastSyncStatus: syncConfig.lastSyncStatus,
      lastSyncError: syncConfig.lastSyncError,
      tokenExpiresAt: syncConfig.tokenExpiresAt,
    });
  } catch (error: any) {
    console.error('Error fetching calendar status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/calendar/status
 * Update Google Calendar sync settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const userId = authUser.studentId || authUser.instructorId || '';
    const body = await request.json();
    const { syncEnabled, syncDirection, calendarId } = body;

    const syncConfig = await prisma.googleCalendarSync.findUnique({
      where: { userId },
    });

    if (!syncConfig) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    const updated = await prisma.googleCalendarSync.update({
      where: { id: syncConfig.id },
      data: {
        syncEnabled: syncEnabled !== undefined ? syncEnabled : syncConfig.syncEnabled,
        syncDirection: syncDirection || syncConfig.syncDirection,
        calendarId: calendarId || syncConfig.calendarId,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating calendar settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/status
 * Disconnect Google Calendar
 */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const userId = authUser.studentId || authUser.instructorId || '';

    await prisma.googleCalendarSync.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

