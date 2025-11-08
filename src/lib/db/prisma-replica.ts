import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client with Read Replica Support
 * 
 * This module provides separate clients for read and write operations.
 * In production with read replicas, use DATABASE_URL_REPLICA for reads.
 */

const globalForPrisma = globalThis as unknown as {
  prismaWrite: PrismaClient | undefined;
  prismaRead: PrismaClient | undefined;
};

// Primary database (for writes)
export const prismaWrite =
  globalForPrisma.prismaWrite ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Read replica (for reads) - falls back to primary if no replica configured
export const prismaRead =
  globalForPrisma.prismaRead ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_REPLICA || process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaWrite = prismaWrite;
  globalForPrisma.prismaRead = prismaRead;
}

/**
 * Helper to determine if operation is read-only
 */
function isReadOperation(operation: string): boolean {
  const readOps = ['findUnique', 'findMany', 'findFirst', 'count', 'aggregate', 'groupBy'];
  return readOps.some(op => operation.toLowerCase().includes(op.toLowerCase()));
}

/**
 * Get appropriate Prisma client based on operation type
 * For now, we'll use the read client for all operations if replica is configured
 * In production, you'd route based on operation type
 */
export function getPrismaClient(forRead: boolean = false): PrismaClient {
  // If replica is configured, use it for reads
  if (forRead && process.env.DATABASE_URL_REPLICA) {
    return prismaRead;
  }
  // Otherwise, use primary for everything
  return prismaWrite;
}

/**
 * Execute read operation on replica (if available)
 */
export async function readQuery<T>(
  operation: () => Promise<T>
): Promise<T> {
  // In production, this would use prismaRead
  // For now, we'll use the primary but structure for future replica support
  return operation();
}

/**
 * Execute write operation on primary
 */
export async function writeQuery<T>(
  operation: () => Promise<T>
): Promise<T> {
  return operation();
}

