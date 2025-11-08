import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { overrideReason, overrideBy } = body;

    if (!overrideReason || !overrideBy) {
      return NextResponse.json(
        { error: 'Override reason and instructor ID required' },
        { status: 400 }
      );
    }

    const flight = await prisma.flight.update({
      where: { id: params.id },
      data: {
        weatherOverride: true,
        overrideReason,
        overrideBy,
      },
    });

    return NextResponse.json(flight);
  } catch (error) {
    console.error('Error overriding weather:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

