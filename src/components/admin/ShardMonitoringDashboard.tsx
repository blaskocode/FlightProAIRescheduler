'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ShardStatus {
  shardId: number;
  schoolCount: number;
  health: 'healthy' | 'degraded' | 'down';
  config: {
    shardId: number;
    isActive: boolean;
  };
}

interface ShardDistribution {
  shardId: number;
  schoolCount: number;
  targetCount: number;
  imbalance: number;
}

interface ShardingStatus {
  shards: ShardStatus[];
  distribution: ShardDistribution[];
  needsRebalance: boolean;
  timestamp: string;
}

export function ShardMonitoringDashboard() {
  const [status, setStatus] = useState<ShardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rebalancing, setRebalancing] = useState(false);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      setLoading(true);
      // Get current user's UID (in production, get from auth context)
      const uid = localStorage.getItem('firebase_uid'); // Temporary
      
      const response = await fetch(`/api/sharding/status?uid=${uid}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch sharding status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sharding status');
    } finally {
      setLoading(false);
    }
  }

  async function handleRebalance() {
    if (!status) return;
    
    const targetShardCount = status.shards.length;
    const confirmed = window.confirm(
      `This will rebalance data across ${targetShardCount} shards. This is a dry run. Continue?`
    );
    
    if (!confirmed) return;

    try {
      setRebalancing(true);
      const uid = localStorage.getItem('firebase_uid'); // Temporary
      
      const response = await fetch(`/api/sharding/rebalance?uid=${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetShardCount,
          dryRun: true, // Always dry run for safety
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Rebalance plan generated: ${data.planCount} schools would be moved. Check console for details.`);
        console.log('Rebalance plan:', data);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRebalancing(false);
    }
  }

  if (loading && !status) {
    return <div>Loading sharding status...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shard Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={fetchStatus} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return <div>No sharding status available</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Shard Status</CardTitle>
            <Button onClick={fetchStatus} size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status.shards.map((shard) => (
              <div
                key={shard.shardId}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-semibold">Shard {shard.shardId}</h3>
                  <p className="text-sm text-gray-600">
                    {shard.schoolCount} schools
                  </p>
                </div>
                <Badge
                  variant={
                    shard.health === 'healthy'
                      ? 'default'
                      : shard.health === 'degraded'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {shard.health}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shard Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {status.distribution.map((dist) => (
              <div key={dist.shardId} className="flex items-center justify-between">
                <span className="text-sm">Shard {dist.shardId}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {dist.schoolCount} / {dist.targetCount} (target)
                  </span>
                  {dist.imbalance !== 0 && (
                    <span
                      className={`text-sm ${
                        dist.imbalance > 0 ? 'text-orange-600' : 'text-blue-600'
                      }`}
                    >
                      {dist.imbalance > 0 ? '+' : ''}
                      {dist.imbalance}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {status.needsRebalance && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Shard imbalance detected. Consider rebalancing.
              </p>
              <Button
                onClick={handleRebalance}
                disabled={rebalancing}
                className="mt-2"
                size="sm"
              >
                {rebalancing ? 'Generating Plan...' : 'Generate Rebalance Plan'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last Updated</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {new Date(status.timestamp).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

