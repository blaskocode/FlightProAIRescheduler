'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  database: {
    connected: boolean;
    latency: number;
    readReplicaConfigured: boolean;
    poolInfo: {
      activeConnections: string | number;
      maxConnections: string | number;
    };
  };
  cache: any;
  timestamp: string;
}

interface DatabaseStats {
  tableCounts: {
    students: number;
    instructors: number;
    flights: number;
    aircraft: number;
    weatherChecks: number;
  };
  cache: any;
  performance: {
    avgResponseTime: string | number;
    p95ResponseTime: string | number;
    slowQueries: any[];
  };
  timestamp: string;
}

export function DatabaseHealthDashboard() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
    fetchStats();
  }, []);

  async function fetchHealth() {
    try {
      const response = await fetch('/api/db/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch database health');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch database health');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/db/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err: any) {
      console.error('Error fetching database stats:', err);
    }
  }

  if (loading) {
    return <div>Loading database health...</div>;
  }

  if (error && !health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Database Health</CardTitle>
            <Badge
              className={
                health?.status === 'healthy'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }
            >
              {health?.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {health && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-600">Connection</p>
                  <p className="text-lg font-bold">
                    {health.database.connected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-600">Latency</p>
                  <p className="text-lg font-bold">{health.database.latency}ms</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-600">Read Replica</p>
                  <p className="text-lg font-bold">
                    {health.database.readReplicaConfigured ? 'Configured' : 'Not Configured'}
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-gray-600">Active Connections</p>
                  <p className="text-lg font-bold">
                    {health.database.poolInfo.activeConnections} / {health.database.poolInfo.maxConnections}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Last checked: {new Date(health.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Database Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Table Row Counts</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-gray-600">Students</p>
                    <p className="text-xl font-bold">{stats.tableCounts.students}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-gray-600">Instructors</p>
                    <p className="text-xl font-bold">{stats.tableCounts.instructors}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-gray-600">Flights</p>
                    <p className="text-xl font-bold">{stats.tableCounts.flights}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-gray-600">Aircraft</p>
                    <p className="text-xl font-bold">{stats.tableCounts.aircraft}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-gray-600">Weather Checks</p>
                    <p className="text-xl font-bold">{stats.tableCounts.weatherChecks}</p>
                  </div>
                </div>
              </div>

              {stats.performance && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-2">Query Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-gray-600">Avg Response Time</p>
                      <p className="text-lg font-bold">
                        {typeof stats.performance.avgResponseTime === 'number'
                          ? `${stats.performance.avgResponseTime}ms`
                          : stats.performance.avgResponseTime}
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-gray-600">P95 Response Time</p>
                      <p className="text-lg font-bold">
                        {typeof stats.performance.p95ResponseTime === 'number'
                          ? `${stats.performance.p95ResponseTime}ms`
                          : stats.performance.p95ResponseTime}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button onClick={() => { fetchHealth(); fetchStats(); }} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

