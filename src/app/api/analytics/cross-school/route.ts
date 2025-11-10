import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserRole } from '@/lib/auth';
import { calculateWeatherImpact, calculateAircraftUtilization, calculateInstructorEfficiency, calculateStudentProgress } from '@/lib/services/analytics-service';

/**
 * GET /api/analytics/cross-school
 * Get analytics across all schools (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth user
    const uid = request.nextUrl.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authUser = await getUserRole(uid);
    if (!authUser || authUser.role !== 'admin' || !authUser.adminId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if super admin
    const admin = await prisma.admin.findUnique({
      where: { id: authUser.adminId },
      select: { role: true, schoolId: true },
    });

    if (admin?.role !== 'super_admin' && admin?.schoolId !== null) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const startDateParam = request.nextUrl.searchParams.get('startDate');
    const endDateParam = request.nextUrl.searchParams.get('endDate');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all schools
    const schools = await prisma.school.findMany({
      select: { id: true, name: true, airportCode: true },
    });

    // Aggregate metrics across all schools
    const crossSchoolMetrics = await Promise.all(
      schools.map(async (school) => {
        const weatherImpact = await calculateWeatherImpact(school.id, startDate, endDate);
        const aircraftUtilization = await calculateAircraftUtilization(school.id, startDate, endDate);
        const instructorEfficiency = await calculateInstructorEfficiency(school.id, startDate, endDate);
        const studentProgress = await calculateStudentProgress(school.id);

        return {
          school: {
            id: school.id,
            name: school.name,
            airportCode: school.airportCode,
          },
          weatherImpact,
          aircraftUtilization,
          instructorEfficiency,
          studentProgress,
        };
      })
    );

    // Calculate totals
    const totals = {
      totalFlights: crossSchoolMetrics.reduce((sum, m) => sum + m.weatherImpact.totalFlights, 0),
      totalWeatherCancellations: crossSchoolMetrics.reduce((sum, m) => sum + m.weatherImpact.weatherCancellations, 0),
      totalRevenueProtected: crossSchoolMetrics.reduce((sum, m) => sum + m.weatherImpact.revenueProtected, 0),
      totalRevenueLost: crossSchoolMetrics.reduce((sum, m) => sum + m.weatherImpact.revenueLost, 0),
      totalStudents: crossSchoolMetrics.reduce((sum, m) => sum + m.studentProgress.onTrack + m.studentProgress.delayed + m.studentProgress.atRisk, 0),
      totalAircraft: crossSchoolMetrics.reduce((sum, m) => sum + m.aircraftUtilization.length, 0),
      totalInstructors: crossSchoolMetrics.reduce((sum, m) => sum + m.instructorEfficiency.length, 0),
    };

    return NextResponse.json({
      schools: crossSchoolMetrics,
      totals,
      dateRange: {
        startDate,
        endDate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching cross-school analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

