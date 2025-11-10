import { PrismaClient } from '@prisma/client';
import { executeAcrossAllShards } from './shard-routing';

/**
 * Cross-Shard Query Federation
 * 
 * Provides utilities for executing queries that need to aggregate data
 * across multiple shards (e.g., super admin analytics).
 */

/**
 * Federate a query across all shards and merge results
 */
export async function federateQuery<T>(
  operation: (prisma: PrismaClient, shardId: number) => Promise<T[]>
): Promise<T[]> {
  const results = await executeAcrossAllShards(operation);
  
  // Merge all results into a single array
  const merged: T[] = [];
  for (const result of results.values()) {
    if (Array.isArray(result)) {
      merged.push(...result);
    } else {
      merged.push(result);
    }
  }
  
  return merged;
}

/**
 * Federate a query and aggregate counts
 */
export async function federateCount(
  operation: (prisma: PrismaClient, shardId: number) => Promise<number>
): Promise<number> {
  const results = await executeAcrossAllShards(operation);
  
  let total = 0;
  for (const count of results.values()) {
    total += typeof count === 'number' ? count : 0;
  }
  
  return total;
}

/**
 * Federate a query with aggregation (sum, avg, etc.)
 */
export async function federateAggregate<T>(
  operation: (prisma: PrismaClient, shardId: number) => Promise<T>
): Promise<Map<number, T>> {
  return executeAcrossAllShards(operation);
}

/**
 * Get all schools across all shards (super admin only)
 */
export async function getAllSchoolsAcrossShards() {
  return federateQuery(async (prisma, shardId) => {
    return prisma.school.findMany({
      select: {
        id: true,
        name: true,
        airportCode: true,
        createdAt: true,
      },
    });
  });
}

/**
 * Get total flight count across all shards
 */
export async function getTotalFlightsAcrossShards(
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  return federateCount(async (prisma, shardId) => {
    const where: any = {};
    if (startDate || endDate) {
      where.scheduledStart = {};
      if (startDate) where.scheduledStart.gte = startDate;
      if (endDate) where.scheduledStart.lte = endDate;
    }
    
    return prisma.flight.count({ where });
  });
}

/**
 * Get aggregated metrics across all shards
 */
export async function getAggregatedMetricsAcrossShards(
  startDate: Date,
  endDate: Date
): Promise<any> {
  // TODO: Implement getShardPool in shard-routing.ts
  throw new Error('getShardPool not yet implemented in shard-routing.ts');
  
  /* Commented out until getShardPool is implemented
  const pool = getShardPool();
  const configs = pool.getConfigs();
  
  const metrics = await Promise.all(
    configs.map(async (config) => {
      if (!config.isActive) return null;
      
      try {
        const connection = pool.getConnection(config.shardId);
        
        const [flightCount, studentCount, instructorCount, aircraftCount] = await Promise.all([
          connection.flight.count({
            where: {
              scheduledStart: {
                gte: startDate,
                lte: endDate,
              },
            },
          }),
          connection.student.count(),
          connection.instructor.count(),
          connection.aircraft.count(),
        ]);
        
        return {
          shardId: config.shardId,
          flightCount,
          studentCount,
          instructorCount,
          aircraftCount,
        };
      } catch (error) {
        console.error(`Error getting metrics for shard ${config.shardId}:`, error);
        return {
          shardId: config.shardId,
          flightCount: 0,
          studentCount: 0,
          instructorCount: 0,
          aircraftCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );
  
  // Aggregate totals
  const totals = metrics.reduce(
    (acc, m) => {
      if (!m) return acc;
      return {
        flightCount: acc.flightCount + m.flightCount,
        studentCount: acc.studentCount + m.studentCount,
        instructorCount: acc.instructorCount + m.instructorCount,
        aircraftCount: acc.aircraftCount + m.aircraftCount,
      };
    },
    { flightCount: 0, studentCount: 0, instructorCount: 0, aircraftCount: 0 }
  );
  
  return {
    shards: metrics.filter(Boolean),
    totals,
  };
  */
}

