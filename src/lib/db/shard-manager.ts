import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

/**
 * Database Sharding Manager
 * 
 * Routes database queries to appropriate shards based on schoolId.
 * Sharding strategy: Hash-based distribution using schoolId as shard key.
 */

export interface ShardConfig {
  shardId: number;
  databaseUrl: string;
  isActive: boolean;
  weight?: number; // For weighted distribution
}

export interface ShardMetadata {
  shardId: number;
  schoolCount: number;
  lastUpdated: Date;
  health: 'healthy' | 'degraded' | 'down';
}

// Default shard configuration
// In production, these would come from environment variables or a config service
const DEFAULT_SHARD_CONFIGS: ShardConfig[] = [
  {
    shardId: 1,
    databaseUrl: process.env.DATABASE_URL || '',
    isActive: true,
    weight: 1,
  },
  // Additional shards would be configured via DATABASE_URL_SHARD_2, DATABASE_URL_SHARD_3, etc.
  ...(process.env.DATABASE_URL_SHARD_2
    ? [
        {
          shardId: 2,
          databaseUrl: process.env.DATABASE_URL_SHARD_2,
          isActive: true,
          weight: 1,
        },
      ]
    : []),
  ...(process.env.DATABASE_URL_SHARD_3
    ? [
        {
          shardId: 3,
          databaseUrl: process.env.DATABASE_URL_SHARD_3,
          isActive: true,
          weight: 1,
        },
      ]
    : []),
];

/**
 * Get shard ID for a given schoolId using consistent hashing
 */
export function getShardForSchool(schoolId: string, numShards: number = DEFAULT_SHARD_CONFIGS.length): number {
  if (numShards === 1) return 1; // Single shard, no routing needed

  // Create MD5 hash of schoolId
  const hash = createHash('md5').update(schoolId).digest('hex');
  
  // Use first 8 characters of hash as integer
  const hashInt = parseInt(hash.substring(0, 8), 16);
  
  // Map to shard (1-indexed)
  return (hashInt % numShards) + 1;
}

/**
 * Shard connection pool
 * Maintains PrismaClient instances for each shard
 */
class ShardConnectionPool {
  private connections: Map<number, PrismaClient> = new Map();
  private configs: ShardConfig[];

  constructor(configs: ShardConfig[] = DEFAULT_SHARD_CONFIGS) {
    this.configs = configs.filter((c) => c.isActive);
    this.initializeConnections();
  }

  private initializeConnections() {
    for (const config of this.configs) {
      if (!config.isActive) continue;

      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: config.databaseUrl,
          },
        },
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });

      this.connections.set(config.shardId, prisma);
    }
  }

  /**
   * Get PrismaClient for a specific shard
   */
  getConnection(shardId: number): PrismaClient {
    const connection = this.connections.get(shardId);
    if (!connection) {
      throw new Error(`Shard ${shardId} not found or not active`);
    }
    return connection;
  }

  /**
   * Get PrismaClient for a school (routed by schoolId)
   */
  getConnectionForSchool(schoolId: string): PrismaClient {
    const shardId = getShardForSchool(schoolId, this.configs.length);
    return this.getConnection(shardId);
  }

  /**
   * Get all active shard connections
   */
  getAllConnections(): Map<number, PrismaClient> {
    return new Map(this.connections);
  }

  /**
   * Get shard configs
   */
  getConfigs(): ShardConfig[] {
    return [...this.configs];
  }

  /**
   * Check shard health
   */
  async checkShardHealth(shardId: number): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const connection = this.getConnection(shardId);
      await connection.$queryRaw`SELECT 1`;
      return 'healthy';
    } catch (error) {
      console.error(`Shard ${shardId} health check failed:`, error);
      return 'down';
    }
  }

  /**
   * Check all shards health
   */
  async checkAllShardsHealth(): Promise<Map<number, 'healthy' | 'degraded' | 'down'>> {
    const healthMap = new Map<number, 'healthy' | 'degraded' | 'down'>();
    
    for (const config of this.configs) {
      if (config.isActive) {
        const health = await this.checkShardHealth(config.shardId);
        healthMap.set(config.shardId, health);
      }
    }

    return healthMap;
  }

  /**
   * Close all connections
   */
  async disconnect(): Promise<void> {
    for (const connection of this.connections.values()) {
      await connection.$disconnect();
    }
    this.connections.clear();
  }
}

// Singleton instance
let shardPool: ShardConnectionPool | null = null;

/**
 * Get the shard connection pool singleton
 */
export function getShardPool(): ShardConnectionPool {
  if (!shardPool) {
    shardPool = new ShardConnectionPool();
  }
  return shardPool;
}

/**
 * Get PrismaClient for a school (convenience function)
 */
export function getPrismaForSchool(schoolId: string): PrismaClient {
  return getShardPool().getConnectionForSchool(schoolId);
}

/**
 * Get PrismaClient for a specific shard
 */
export function getPrismaForShard(shardId: number): PrismaClient {
  return getShardPool().getConnection(shardId);
}

