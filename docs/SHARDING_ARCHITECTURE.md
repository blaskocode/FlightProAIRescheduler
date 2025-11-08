# Database Sharding Architecture

## Overview

The Flight Schedule Pro AI Rescheduler uses database sharding to horizontally scale the database across multiple PostgreSQL instances. Sharding is based on `schoolId` as the shard key, ensuring all data for a school is stored on the same shard.

## Sharding Strategy

### Shard Key: `schoolId`

All data is partitioned by `schoolId`:
- Each school's data (students, instructors, aircraft, flights) resides on a single shard
- This ensures referential integrity and enables efficient queries
- Cross-shard joins are avoided for normal operations

### Hash-Based Distribution

Shards are assigned using consistent hashing:

```typescript
function getShardForSchool(schoolId: string, numShards: number): number {
  const hash = createHash('md5').update(schoolId).digest('hex');
  const hashInt = parseInt(hash.substring(0, 8), 16);
  return (hashInt % numShards) + 1;
}
```

**Benefits:**
- Even distribution across shards
- Deterministic: same schoolId always maps to same shard
- Minimal rebalancing when adding/removing shards

## Architecture Components

### 1. Shard Manager (`src/lib/db/shard-manager.ts`)

Manages shard connections and routing:
- Maintains connection pool for each shard
- Routes queries to appropriate shard based on `schoolId`
- Health checking and monitoring

**Configuration:**
- `DATABASE_URL` - Primary shard (shard 1)
- `DATABASE_URL_SHARD_2` - Second shard (optional)
- `DATABASE_URL_SHARD_3` - Third shard (optional)
- Additional shards can be added via environment variables

### 2. Shard Routing (`src/lib/db/shard-routing.ts`)

Provides middleware for routing queries:
- `executeOnShard()` - Execute query on specific shard
- `executeAcrossAllShards()` - Execute query on all shards
- `getShardMetadata()` - Get shard health and statistics

### 3. Cross-Shard Federation (`src/lib/db/cross-shard-federation.ts`)

Enables queries across multiple shards:
- `federateQuery()` - Aggregate results from all shards
- `federateCount()` - Sum counts across shards
- Used for super admin analytics and reporting

### 4. Shard Rebalancing (`src/lib/db/shard-rebalancing.ts`)

Manages data redistribution:
- `analyzeShardDistribution()` - Identify imbalances
- `generateRebalancePlan()` - Plan data moves
- `executeRebalance()` - Move data between shards

**Rebalancing is complex and should be done during maintenance windows.**

## Data Model

### ShardMetadata Table

Tracks shard health and statistics:

```prisma
model ShardMetadata {
  id                String   @id @default(cuid())
  shardId           Int      @unique
  schoolCount       Int      @default(0)
  lastUpdated       DateTime @default(now()) @updatedAt
  health            String   @default("healthy")
  activeConnections Int      @default(0)
  queryCount        Int      @default(0)
  errorCount        Int      @default(0)
  createdAt         DateTime @default(now())
}
```

## Usage Examples

### Single-Shard Query (Normal Operation)

```typescript
import { executeOnShard } from '@/lib/db/shard-routing';

// Get flights for a school
const flights = await executeOnShard(
  async (prisma) => {
    return prisma.flight.findMany({
      where: { schoolId },
      include: { student: true, aircraft: true },
    });
  },
  { schoolId }
);
```

### Cross-Shard Query (Super Admin)

```typescript
import { getAllSchoolsAcrossShards } from '@/lib/db/cross-shard-federation';

// Get all schools across all shards
const allSchools = await getAllSchoolsAcrossShards();
```

### Shard Health Monitoring

```typescript
import { getShardMetadata } from '@/lib/db/shard-routing';

const metadata = await getShardMetadata();
// Returns: [{ shardId, schoolCount, health, config }, ...]
```

## API Endpoints

### GET `/api/sharding/status`
Get sharding status and health (super admin only)

### POST `/api/sharding/rebalance`
Generate or execute rebalance plan (super admin only)

### GET `/api/sharding/federate`
Execute federated queries across all shards (super admin only)

## Monitoring Dashboard

The `ShardMonitoringDashboard` component provides:
- Real-time shard health status
- School distribution across shards
- Imbalance detection
- Rebalance plan generation

## Best Practices

1. **Always use `schoolId` in queries** - This ensures proper shard routing
2. **Avoid cross-shard joins** - Design queries to work within a single shard
3. **Monitor shard health** - Use the monitoring dashboard regularly
4. **Rebalance carefully** - Rebalancing is complex; test thoroughly
5. **Use federation sparingly** - Cross-shard queries are slower; use only for admin operations

## Migration Path

### Adding a New Shard

1. Add `DATABASE_URL_SHARD_N` environment variable
2. Update shard configuration
3. Run rebalancing to redistribute data
4. Monitor shard health

### Removing a Shard

1. Generate rebalance plan to move all data
2. Execute rebalance (during maintenance window)
3. Remove shard configuration
4. Update environment variables

## Performance Considerations

- **Single-shard queries**: Fast (same as non-sharded)
- **Cross-shard queries**: Slower (network overhead)
- **Rebalancing**: Very slow (full data migration)

## Security

- Shard routing is transparent to application code
- Super admin operations require authentication
- Data isolation is enforced at the shard level

## Future Enhancements

- Automatic rebalancing based on load
- Shard replication for high availability
- Dynamic shard allocation
- Query optimization for cross-shard operations

