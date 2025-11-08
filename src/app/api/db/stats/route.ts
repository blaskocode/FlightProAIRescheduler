import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCacheStats } from '@/lib/db/query-cache';

/**
 * GET /api/db/stats
 * Get database statistics and performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Get table row counts (sample queries)
    const [students, instructors, flights, aircraft, weatherChecks] = await Promise.all([
      prisma.student.count(),
      prisma.instructor.count(),
      prisma.flight.count(),
      prisma.aircraft.count(),
      prisma.weatherCheck.count(),
    ]);

    // Get cache stats
    const cacheStats = await getCacheStats();

    // Get recent query performance (simplified - would track in production)
    const queryPerformance = {
      avgResponseTime: 'N/A', // Would track from monitoring
      p95ResponseTime: 'N/A',
      slowQueries: [],
    };

    return NextResponse.json({
      tableCounts: {
        students,
        instructors,
        flights,
        aircraft,
        weatherChecks,
      },
      cache: cacheStats,
      performance: queryPerformance,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching database stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

