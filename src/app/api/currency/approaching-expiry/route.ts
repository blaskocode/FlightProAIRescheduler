import { NextRequest, NextResponse } from 'next/server';
import {
  getStudentsApproachingExpiry,
  getInstructorsApproachingExpiry,
} from '@/lib/services/currency-tracking-service';

/**
 * GET /api/currency/approaching-expiry
 * Get all students and instructors approaching currency expiry
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId') || undefined;
    const threshold = parseInt(searchParams.get('threshold') || '30');

    const [students, instructors] = await Promise.all([
      getStudentsApproachingExpiry(schoolId, threshold),
      getInstructorsApproachingExpiry(schoolId, threshold),
    ]);

    return NextResponse.json({
      students,
      instructors,
      totalAtRisk: students.length + instructors.length,
    });
  } catch (error: any) {
    console.error('Error fetching approaching expiry:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

