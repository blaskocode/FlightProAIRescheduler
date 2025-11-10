import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncFlightToCalendar, refreshAccessToken } from '@/lib/services/google-calendar-service';

/**
 * POST /api/calendar/sync
 * Sync flights to Google Calendar
 */
export async function POST(request: NextRequest) {
  let authUser;
  try {
    authUser = await requireAuth();
    const body = await request.json();
    const { flightId } = body;

    if (!flightId) {
      return NextResponse.json(
        { error: 'flightId is required' },
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

    // Get flight details
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      include: {
        student: true,
        instructor: true,
        aircraft: true,
      },
    });

    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    // Check if token needs refresh
    let accessToken = syncConfig.accessToken;
    if (new Date(syncConfig.tokenExpiresAt) < new Date()) {
      accessToken = await refreshAccessToken(syncConfig.refreshToken);
      
      // Update token in database
      await prisma.googleCalendarSync.update({
        where: { id: syncConfig.id },
        data: {
          accessToken,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
        },
      });
    }

    // Sync flight to calendar
    const result = await syncFlightToCalendar(flight, {
      accessToken,
      refreshToken: syncConfig.refreshToken,
      calendarId: syncConfig.calendarId,
      syncEnabled: syncConfig.syncEnabled,
    });

    // Update flight with calendar event ID
    await prisma.flight.update({
      where: { id: flightId },
      data: {
        calendarEventId: result.eventId,
        calendarSyncedAt: new Date(),
      },
    });

    // Update sync status
    await prisma.googleCalendarSync.update({
      where: { id: syncConfig.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: result.eventId,
    });
  } catch (error: any) {
    console.error('Error syncing to calendar:', error);
    
    // Update sync status with error
    try {
      const userId = authUser?.studentId || authUser?.instructorId || '';
      if (userId) {
        await prisma.googleCalendarSync.updateMany({
          where: { userId },
          data: {
            lastSyncStatus: 'error',
            lastSyncError: error.message,
          },
        });
      }
    } catch (updateError) {
      // Ignore update errors
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

