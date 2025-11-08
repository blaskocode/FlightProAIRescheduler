import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const progress = await prisma.studentProgress.findMany({
      where: { studentId: params.id },
      include: {
        lesson: true,
      },
      orderBy: {
        lesson: {
          lessonNumber: 'asc',
        },
      },
    });

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      select: {
        currentStage: true,
        currentLesson: true,
        totalFlightHours: true,
        soloHours: true,
        crossCountryHours: true,
      },
    });

    return NextResponse.json({
      student,
      progress,
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

