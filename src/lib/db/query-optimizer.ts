import { prisma } from '@/lib/prisma';
import { cacheQuery, generateCacheKey } from './query-cache';

/**
 * Query Optimizer Utilities
 * Provides optimized query patterns and batch operations
 */

/**
 * Batch fetch related data to avoid N+1 queries
 */
export async function batchFetch<T>(
  ids: string[],
  fetchFn: (ids: string[]) => Promise<T[]>,
  cacheKey?: string
): Promise<Map<string, T>> {
  if (ids.length === 0) {
    return new Map();
  }

  const uniqueIds = [...new Set(ids)];
  
  const fetchData = async () => {
    const results = await fetchFn(uniqueIds);
    return results;
  };

  const results = cacheKey
    ? await cacheQuery(generateCacheKey(cacheKey, { ids: uniqueIds }), fetchData, 300)
    : await fetchData();

  const map = new Map<string, T>();
  results.forEach((item: any) => {
    if (item.id) {
      map.set(item.id, item);
    }
  });

  return map;
}

/**
 * Optimized flight list query with all relations
 */
export async function getFlightsOptimized(filters: {
  schoolId?: string;
  studentId?: string;
  instructorId?: string;
  aircraftId?: string;
  status?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const cacheKey = generateCacheKey('flights', filters);
  
  return cacheQuery(cacheKey, async () => {
    // Single query with all includes to avoid N+1
    const flights = await prisma.flight.findMany({
      where: {
        schoolId: filters.schoolId,
        studentId: filters.studentId,
        instructorId: filters.instructorId,
        aircraftId: filters.aircraftId,
        status: filters.status ? { in: filters.status as any[] } : undefined,
        scheduledStart: filters.startDate || filters.endDate
          ? {
              gte: filters.startDate,
              lte: filters.endDate,
            }
          : undefined,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            trainingLevel: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        aircraft: {
          include: {
            aircraftType: {
              select: {
                id: true,
                make: true,
                model: true,
              },
            },
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            airportCode: true,
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    return flights;
  }, 60); // Cache for 1 minute
}

/**
 * Optimized student list with progress
 */
export async function getStudentsOptimized(schoolId?: string) {
  const cacheKey = generateCacheKey('students', { schoolId });
  
  return cacheQuery(cacheKey, async () => {
    return prisma.student.findMany({
      where: {
        schoolId: schoolId || undefined,
      },
      include: {
        progress: {
          take: 5, // Limit progress entries
          orderBy: {
            createdAt: 'desc',
          },
        },
        preferredInstructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 100, // Limit results
    });
  }, 300); // Cache for 5 minutes
}

/**
 * Optimized aircraft list with maintenance status
 */
export async function getAircraftOptimized(schoolId?: string) {
  const cacheKey = generateCacheKey('aircraft', { schoolId });
  
  return cacheQuery(cacheKey, async () => {
    return prisma.aircraft.findMany({
      where: {
        schoolId: schoolId || undefined,
      },
      include: {
        aircraftType: true,
        squawks: {
          where: {
            status: {
              in: ['OPEN', 'IN_PROGRESS'],
            },
          },
          take: 5,
          orderBy: {
            reportedAt: 'desc',
          },
        },
      },
    });
  }, 300); // Cache for 5 minutes
}

/**
 * Query performance monitoring
 */
export async function monitorQuery<T>(
  name: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 500) {
      console.warn(`Slow query detected: ${name} took ${duration}ms`);
    }
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production' && duration > 1000) {
      // Would send to monitoring service (e.g., Datadog, New Relic)
      console.error(`Very slow query: ${name} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Query failed: ${name} after ${duration}ms`, error);
    throw error;
  }
}

