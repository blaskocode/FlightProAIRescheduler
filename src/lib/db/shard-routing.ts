import { PrismaClient } from '@prisma/client';
import { getShardPool, getShardForSchool, ShardConfig } from './shard-manager';
import { prisma } from '@/lib/prisma'; // Fallback to default connection

/**
 * Shard Routing Middleware
 * 
 * Provides utilities for routing queries to appropriate shards
 * and handling cross-shard operations.
 */

export interface ShardQueryOptions {
  schoolId?: string;
  shardId?: number;
  allowCrossShard?: boolean; // For super admin queries
}

/**
 * Execute a query on the appropriate shard based on schoolId
 */
export async function executeOnShard<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  options: ShardQueryOptions
): Promise<T> {
  const { schoolId, shardId, allowCrossShard } = options;

  // If specific shard requested (and allowed)
  if (shardId) {
    const pool = getShardPool();
    const connection = pool.getConnection(shardId);
    return operation(connection);
  }

  // If schoolId provided, route to appropriate shard
  if (schoolId) {
    const pool = getShardPool();
    const connection = pool.getConnectionForSchool(schoolId);
    return operation(connection);
  }

  // If allowCrossShard is true (super admin), use default connection
  // This assumes default connection can query all shards (federated query)
  if (allowCrossShard) {
    return operation(prisma);
  }

  // Fallback: use default connection
  // In production, this should probably throw an error if schoolId is required
  return operation(prisma);
}

/**
 * Execute query across all shards and aggregate results
 */
export async function executeAcrossAllShards<T>(
  operation: (prisma: PrismaClient, shardId: number) => Promise<T>
): Promise<Map<number, T>> {
  const pool = getShardPool();
  const configs = pool.getConfigs();
  const results = new Map<number, T>();

  await Promise.all(
    configs.map(async (config) => {
      if (config.isActive) {
        try {
          const connection = pool.getConnection(config.shardId);
          const result = await operation(connection, config.shardId);
          results.set(config.shardId, result);
        } catch (error) {
          console.error(`Error executing query on shard ${config.shardId}:`, error);
          // Continue with other shards even if one fails
        }
      }
    })
  );

  return results;
}

/**
 * Get shard metadata for monitoring
 */
export async function getShardMetadata(): Promise<Array<{
  shardId: number;
  schoolCount: number;
  health: 'healthy' | 'degraded' | 'down';
  config: ShardConfig;
}>> {
  const pool = getShardPool();
  const configs = pool.getConfigs();
  const healthMap = await pool.checkAllShardsHealth();

  const metadata = await Promise.all(
    configs.map(async (config) => {
      const health = healthMap.get(config.shardId) || 'down';
      
      // Count schools on this shard (if shard has metadata table)
      let schoolCount = 0;
      try {
        const connection = pool.getConnection(config.shardId);
        // This assumes a ShardMetadata table exists (we'll create it)
        // For now, we'll try to count schools directly
        schoolCount = await connection.school.count();
      } catch (error) {
        console.error(`Error counting schools on shard ${config.shardId}:`, error);
      }

      return {
        shardId: config.shardId,
        schoolCount,
        health,
        config,
      };
    })
  );

  return metadata;
}

