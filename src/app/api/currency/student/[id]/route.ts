import { NextRequest, NextResponse } from 'next/server';
import { getStudentCurrencyStatus } from '@/lib/services/currency-tracking-service';

/**
 * GET /api/currency/student/:id
 * Get currency status for a specific student
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const status = await getStudentCurrencyStatus(params.id);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error fetching student currency status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

