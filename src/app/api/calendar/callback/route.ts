import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/calendar/callback
 * Handle Google Calendar OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?error=missing_parameters`
      );
    }

    // Verify state token
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?error=invalid_state`
      );
    }

    const authUser = await requireAuth();
    if (authUser.uid !== stateData.userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?error=user_mismatch`
      );
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calendar/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?error=${encodeURIComponent(errorData.error || 'token_exchange_failed')}`
      );
    }

    const tokenData = await tokenResponse.json();
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Get user's school ID
    let schoolId: string | null = null;
    if (authUser.role === 'student' && authUser.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: authUser.studentId },
        select: { schoolId: true },
      });
      schoolId = student?.schoolId || null;
    } else if (authUser.role === 'instructor' && authUser.instructorId) {
      const instructor = await prisma.instructor.findUnique({
        where: { id: authUser.instructorId },
        select: { schoolId: true },
      });
      schoolId = instructor?.schoolId || null;
    }

    if (!schoolId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?error=no_school`
      );
    }

    // Save or update calendar sync configuration
    const userId = authUser.studentId || authUser.instructorId || '';
    await prisma.googleCalendarSync.upsert({
      where: { userId },
      create: {
        userId,
        userType: authUser.role,
        schoolId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || '',
        tokenExpiresAt: expiresAt,
        syncEnabled: true,
        syncDirection: 'bidirectional',
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || tokenData.access_token,
        tokenExpiresAt: expiresAt,
        syncEnabled: true,
        lastSyncAt: null, // Reset sync status
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?success=connected`
    );
  } catch (error: any) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/calendar?error=${encodeURIComponent(error.message || 'unknown_error')}`
    );
  }
}

