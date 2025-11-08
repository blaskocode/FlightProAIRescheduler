import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions/check';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sms/costs
 * Get SMS cost tracking (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();

    // Only admins can view SMS costs
    if (!(await hasPermission(authUser, 'settings.view'))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (startDate || endDate) {
      where.sentAt = {};
      if (startDate) where.sentAt.gte = new Date(startDate);
      if (endDate) where.sentAt.lte = new Date(endDate);
    }

    const [costs, totalCost] = await Promise.all([
      prisma.sMSCost.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: 100,
      }),
      prisma.sMSCost.aggregate({
        where,
        _sum: { cost: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      costs,
      summary: {
        totalCost: totalCost._sum.cost || 0,
        totalMessages: totalCost._count.id || 0,
        averageCost: totalCost._count.id > 0 
          ? (totalCost._sum.cost || 0) / totalCost._count.id 
          : 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching SMS costs:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

