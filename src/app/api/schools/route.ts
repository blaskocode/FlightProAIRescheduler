import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/schools
 * List all schools (for signup selection, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        airportCode: true,
        address: true,
        phone: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

