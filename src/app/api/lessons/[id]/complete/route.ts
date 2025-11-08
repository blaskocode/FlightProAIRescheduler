import { NextRequest, NextResponse } from 'next/server';
import { completeLesson } from '@/lib/services/progress-tracking-service';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/lessons/:id/complete
 * Mark a lesson as complete for a student
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { studentId, objectivesMet, satisfactory, instructorNotes, studentNotes, needsReview, flightId } = body;

    if (!studentId || !objectivesMet || satisfactory === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, objectivesMet, satisfactory' },
        { status: 400 }
      );
    }

    // Verify lesson exists
    const lesson = await prisma.lessonSyllabus.findUnique({
      where: { id: params.id },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Mark lesson as complete
    const progress = await completeLesson(studentId, params.id, {
      flightId,
      objectivesMet,
      satisfactory,
      instructorNotes,
      studentNotes,
      needsReview,
    });

    return NextResponse.json({
      success: true,
      progress,
      message: satisfactory
        ? 'Lesson marked as completed'
        : 'Lesson marked as requiring review',
    });
  } catch (error: any) {
    console.error('Error completing lesson:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

