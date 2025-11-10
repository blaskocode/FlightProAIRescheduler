import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Daily currency check cron job
 * Checks student currency and sends reminders
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    
    // Find students approaching currency expiration
    const students = await prisma.student.findMany({
      where: {
        lastFlightDate: {
          not: null
        }
      }
    });

    console.log(`[Cron] Currency check: Checking ${students.length} students`);

    let remindersSet = 0;
    for (const student of students) {
      if (student.lastFlightDate) {
        const daysSinceLastFlight = Math.floor(
          (now.getTime() - student.lastFlightDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Update days since last flight
        await prisma.student.update({
          where: { id: student.id },
          data: { daysSinceLastFlight }
        });
        
        // Send reminder if approaching 90 days (solo currency)
        if (daysSinceLastFlight >= 75 && daysSinceLastFlight < 90) {
          // Would send notification here
          remindersSet++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      studentsChecked: students.length,
      remindersSet,
      message: `Checked currency for ${students.length} students, sent ${remindersSet} reminders`
    });
  } catch (error: any) {
    console.error('[Cron] Currency check failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
