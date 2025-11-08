import { NextRequest, NextResponse } from 'next/server';
import { getNextLesson } from '@/lib/services/progress-tracking-service';

/**
 * GET /api/students/:id/next-lesson
 * Get the next recommended lesson for a student
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recommendation = await getNextLesson(params.id);

    return NextResponse.json(recommendation);
  } catch (error: any) {
    console.error('Error fetching next lesson:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

