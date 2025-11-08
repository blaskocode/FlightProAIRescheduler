import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get('stage');

    const where: any = {};
    if (stage) where.stage = stage;

    const lessons = await prisma.lessonSyllabus.findMany({
      where,
      orderBy: [
        { stage: 'asc' },
        { lessonNumber: 'asc' },
      ],
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching syllabus:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

