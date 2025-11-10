import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions/check';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const authUser = await requireAuth(request);
    
    // Check if user has weather.override permission
    const canOverride = await hasPermission(authUser, 'weather.override');
    if (!canOverride) {
      return NextResponse.json(
        { error: 'You do not have permission to override weather decisions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { overrideReason } = body;

    if (!overrideReason || !overrideReason.trim()) {
      return NextResponse.json(
        { error: 'Override reason is required' },
        { status: 400 }
      );
    }

    if (overrideReason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Override reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Get the flight to verify it exists and check status
    const flight = await prisma.flight.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        instructorId: true,
        schoolId: true,
      },
    });

    if (!flight) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    // Determine overrideBy based on user role
    let overrideBy: string | null = null;
    if (authUser.role === 'instructor' && authUser.instructorId) {
      overrideBy = authUser.instructorId;
    } else if (authUser.role === 'admin') {
      // For admins, use the flight's instructor ID if available, or null
      overrideBy = flight.instructorId;
    }

    // Update flight with weather override
    const updatedFlight = await prisma.flight.update({
      where: { id: params.id },
      data: {
        weatherOverride: true,
        overrideReason: overrideReason.trim(),
        overrideBy,
        // If flight was cancelled due to weather, change status back to CONFIRMED
        status: flight.status === 'WEATHER_CANCELLED' ? 'CONFIRMED' : flight.status,
      },
    });

    return NextResponse.json(updatedFlight);
  } catch (error: any) {
    console.error('Error overriding weather:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

