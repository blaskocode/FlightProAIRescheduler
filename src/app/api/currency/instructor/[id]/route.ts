import { NextRequest, NextResponse } from 'next/server';
import { getInstructorCurrencyStatus } from '@/lib/services/currency-tracking-service';

/**
 * GET /api/currency/instructor/:id
 * Get currency status for a specific instructor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const status = await getInstructorCurrencyStatus(params.id);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error fetching instructor currency status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

