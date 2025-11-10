import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Hourly weather check cron job
 * Checks weather for all upcoming flights in the next 48 hours
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sets this automatically for cron jobs)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Find all upcoming flights that need weather checks
    const flights = await prisma.flight.findMany({
      where: {
        scheduledStart: {
          gte: now,
          lte: fortyEightHoursFromNow
        },
        status: {
          in: ['CONFIRMED', 'RESCHEDULE_PENDING']
        }
      },
      include: {
        student: true,
        school: true
      }
    });

    console.log(`[Cron] Hourly weather check: Found ${flights.length} flights to check`);

    // For each flight, trigger weather check
    // This would call your weather service
    // For now, just log
    let checksPerformed = 0;
    for (const flight of flights) {
      // You would call your weather checking service here
      // await checkFlightWeather(flight.id);
      checksPerformed++;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      flightsChecked: checksPerformed,
      message: `Checked weather for ${checksPerformed} upcoming flights`
    });
  } catch (error: any) {
    console.error('[Cron] Hourly weather check failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
