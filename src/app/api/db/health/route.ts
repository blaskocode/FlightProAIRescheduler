import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCacheStats } from '@/lib/db/query-cache';

/**
 * GET /api/db/health
 * Database health check and performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const start = Date.now();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    // Get cache stats
    const cacheStats = await getCacheStats();

    // Get connection pool info (simplified)
    const poolInfo = {
      activeConnections: 'N/A', // Would need to query from database
      maxConnections: 'N/A',
    };

    // Check if read replica is configured
    const hasReadReplica = !!process.env.DATABASE_URL_REPLICA;

    return NextResponse.json({
      status: 'healthy',
      database: {
        connected: true,
        latency: dbLatency,
        readReplicaConfigured: hasReadReplica,
        poolInfo,
      },
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

