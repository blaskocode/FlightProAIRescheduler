import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get active weather alerts (UNSAFE or MARGINAL weather checks from recent checks)
    const now = new Date();
    const future = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Next 48 hours

    const alerts = await prisma.weatherCheck.findMany({
      where: {
        result: {
          in: ['UNSAFE', 'MARGINAL'],
        },
        checkTime: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        flight: {
          scheduledStart: {
            gte: now,
            lte: future,
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
        },
      },
      include: {
        flight: {
          select: {
            id: true,
            scheduledStart: true,
            lessonTitle: true,
          },
        },
      },
      orderBy: {
        checkTime: 'desc',
      },
      take: 10, // Limit to 10 most recent alerts
    });

    // Group by flight (only show most recent check per flight)
    const flightMap = new Map();
    alerts.forEach((alert) => {
      const flightId = alert.flightId;
      if (!flightMap.has(flightId) || alert.checkTime > flightMap.get(flightId).checkTime) {
        flightMap.set(flightId, alert);
      }
    });

    const uniqueAlerts = Array.from(flightMap.values()).map((alert) => {
      // Parse reasons if it's a JSON string
      let reasons: string[] = [];
      if (typeof alert.reasons === 'string') {
        try {
          reasons = JSON.parse(alert.reasons);
        } catch {
          reasons = [alert.reasons];
        }
      } else if (Array.isArray(alert.reasons)) {
        reasons = alert.reasons;
      }

      return {
        id: alert.id,
        flightId: alert.flightId,
        result: alert.result,
        confidence: alert.confidence,
        reasons,
        flight: {
          scheduledStart: alert.flight.scheduledStart.toISOString(),
          lessonTitle: alert.flight.lessonTitle,
        },
      };
    });

    return NextResponse.json(uniqueAlerts);
  } catch (error) {
    console.error('Error fetching weather alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

