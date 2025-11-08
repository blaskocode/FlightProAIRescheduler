import { PrismaClient } from '@prisma/client';
import { getShardPool, getShardForSchool } from './shard-manager';

/**
 * Shard Rebalancing Logic
 * 
 * Provides utilities for rebalancing data across shards when needed.
 * This is typically used when:
 * - Adding new shards
 * - Removing shards
 * - Shard becomes imbalanced
 */

export interface RebalancePlan {
  schoolId: string;
  currentShard: number;
  targetShard: number;
  dataSize: number; // Estimated size in bytes
}

export interface RebalanceStats {
  totalSchools: number;
  schoolsMoved: number;
  dataTransferred: number; // bytes
  duration: number; // milliseconds
  errors: number;
}

/**
 * Analyze shard distribution and identify imbalances
 */
export async function analyzeShardDistribution(): Promise<{
  shardId: number;
  schoolCount: number;
  targetCount: number;
  imbalance: number; // positive = over, negative = under
}[]> {
  const pool = getShardPool();
  const configs = pool.getConfigs();
  
  // Count schools per shard
  const shardCounts = await Promise.all(
    configs.map(async (config) => {
      if (!config.isActive) return { shardId: config.shardId, count: 0 };
      
      try {
        const connection = pool.getConnection(config.shardId);
        const count = await connection.school.count();
        return { shardId: config.shardId, count };
      } catch (error) {
        console.error(`Error counting schools on shard ${config.shardId}:`, error);
        return { shardId: config.shardId, count: 0 };
      }
    })
  );
  
  const totalSchools = shardCounts.reduce((sum, s) => sum + s.count, 0);
  const targetCount = totalSchools / configs.filter((c) => c.isActive).length;
  
  return shardCounts.map(({ shardId, count }) => ({
    shardId,
    schoolCount: count,
    targetCount: Math.round(targetCount),
    imbalance: count - targetCount,
  }));
}

/**
 * Generate rebalance plan for moving schools between shards
 */
export async function generateRebalancePlan(
  targetShardCount: number
): Promise<RebalancePlan[]> {
  const pool = getShardPool();
  const analysis = await analyzeShardDistribution();
  
  const plans: RebalancePlan[] = [];
  
  // Get all schools from all shards
  const allSchools = await Promise.all(
    analysis.map(async ({ shardId }) => {
      try {
        const connection = pool.getConnection(shardId);
        const schools = await connection.school.findMany({
          select: { id: true },
        });
        return schools.map((s) => ({ ...s, currentShard: shardId }));
      } catch (error) {
        console.error(`Error fetching schools from shard ${shardId}:`, error);
        return [];
      }
    })
  );
  
  const flatSchools = allSchools.flat();
  
  // For each school, determine if it should move
  for (const school of flatSchools) {
    const currentShard = school.currentShard;
    const targetShard = getShardForSchool(school.id, targetShardCount);
    
    if (currentShard !== targetShard) {
      plans.push({
        schoolId: school.id,
        currentShard,
        targetShard,
        dataSize: 0, // Would calculate actual data size in production
      });
    }
  }
  
  return plans;
}

/**
 * Execute rebalance plan (moves schools between shards)
 * WARNING: This is a complex operation that should be done during maintenance
 */
export async function executeRebalance(
  plans: RebalancePlan[],
  dryRun: boolean = true
): Promise<RebalanceStats> {
  const startTime = Date.now();
  let schoolsMoved = 0;
  let errors = 0;
  let dataTransferred = 0;
  
  const pool = getShardPool();
  
  if (dryRun) {
    console.log('DRY RUN: Would execute', plans.length, 'rebalance operations');
    return {
      totalSchools: plans.length,
      schoolsMoved: 0,
      dataTransferred: 0,
      duration: Date.now() - startTime,
      errors: 0,
    };
  }
  
  // In production, this would:
  // 1. Create transactions on both source and target shards
  // 2. Copy all related data (students, instructors, aircraft, flights, etc.)
  // 3. Verify data integrity
  // 4. Update shard metadata
  // 5. Delete from source shard
  // 6. Handle rollback on errors
  
  // For now, we'll just log the plan
  console.warn('Rebalancing is a complex operation. Implement full data migration logic in production.');
  
  for (const plan of plans) {
    try {
      // This is a placeholder - actual implementation would:
      // - Copy all data from source shard to target shard
      // - Update foreign key references
      // - Verify integrity
      // - Delete from source
      
      console.log(`Would move school ${plan.schoolId} from shard ${plan.currentShard} to shard ${plan.targetShard}`);
      schoolsMoved++;
      dataTransferred += plan.dataSize;
    } catch (error) {
      console.error(`Error moving school ${plan.schoolId}:`, error);
      errors++;
    }
  }
  
  return {
    totalSchools: plans.length,
    schoolsMoved,
    dataTransferred,
    duration: Date.now() - startTime,
    errors,
  };
}

/**
 * Check if rebalancing is needed
 */
export async function isRebalancingNeeded(threshold: number = 0.2): Promise<boolean> {
  const analysis = await analyzeShardDistribution();
  const activeShards = analysis.filter((a) => a.schoolCount > 0);
  
  if (activeShards.length === 0) return false;
  
  const avgCount = activeShards.reduce((sum, a) => sum + a.schoolCount, 0) / activeShards.length;
  
  // Check if any shard deviates more than threshold from average
  for (const shard of activeShards) {
    const deviation = Math.abs(shard.imbalance) / avgCount;
    if (deviation > threshold) {
      return true;
    }
  }
  
  return false;
}

