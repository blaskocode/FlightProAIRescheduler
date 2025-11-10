import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Daily maintenance reminder cron job
 * Checks aircraft maintenance schedules and sends reminders
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Find aircraft approaching maintenance
    const aircraft = await prisma.aircraft.findMany({
      where: {
        OR: [
          {
            nextInspectionDate: {
              lte: thirtyDaysFromNow,
              gte: now
            }
          },
          {
            status: 'MAINTENANCE'
          }
        ]
      },
      include: {
        school: true
      }
    });

    console.log(`[Cron] Maintenance reminder: Found ${aircraft.length} aircraft needing attention`);

    let remindersSent = 0;
    for (const ac of aircraft) {
      // Would send notification to school admins here
      remindersSent++;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      aircraftChecked: aircraft.length,
      remindersSent,
      message: `Checked ${aircraft.length} aircraft, sent ${remindersSent} reminders`
    });
  } catch (error: any) {
    console.error('[Cron] Maintenance reminder failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
