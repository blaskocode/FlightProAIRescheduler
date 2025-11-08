import { NextRequest, NextResponse } from 'next/server';
import { generateStudentWeatherReport } from '@/lib/services/weather-analytics-service';

/**
 * GET /api/weather/analytics/student-report/[studentId]
 * Generate weather report for a specific student
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params;
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); // Default to 90 days

    const report = await generateStudentWeatherReport(studentId, startDate, endDate);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error generating student weather report:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

