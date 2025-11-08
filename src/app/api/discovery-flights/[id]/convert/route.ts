import { NextRequest, NextResponse } from 'next/server';
import { convertDiscoveryToStudent } from '@/lib/services/discovery-flight-service';

/**
 * POST /api/discovery-flights/[id]/convert
 * Convert discovery flight to student account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { firebaseUid } = body;

    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'firebaseUid is required' },
        { status: 400 }
      );
    }

    const result = await convertDiscoveryToStudent(id, firebaseUid);

    return NextResponse.json({
      success: true,
      student: result.student,
      discoveryRecord: result.discoveryRecord,
    });
  } catch (error: any) {
    console.error('Error converting discovery flight:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

