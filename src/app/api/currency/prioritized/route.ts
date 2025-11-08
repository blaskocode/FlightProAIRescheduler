import { NextRequest, NextResponse } from 'next/server';
import { getPrioritizedAtRiskStudents } from '@/lib/services/currency-tracking-service';

/**
 * GET /api/currency/prioritized
 * Get prioritized list of at-risk students for scheduling
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId') || undefined;

    const prioritizedStudents = await getPrioritizedAtRiskStudents(schoolId);

    return NextResponse.json({
      students: prioritizedStudents,
      count: prioritizedStudents.length,
    });
  } catch (error: any) {
    console.error('Error fetching prioritized students:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

