'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DiscoveryFlightMetrics {
  total: number;
  scheduled: number;
  completed: number;
  converted: number;
  conversionRate: number;
  cancelled: number;
}

export function DiscoveryFlightDashboard({ schoolId }: { schoolId: string }) {
  const [metrics, setMetrics] = useState<DiscoveryFlightMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [schoolId]);

  async function fetchMetrics() {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 90);

      const response = await fetch(
        `/api/discovery-flights?schoolId=${schoolId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch metrics');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading discovery flight metrics...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Discovery Flight Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return <div>No metrics available</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Discovery Flight Metrics (Last 90 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold">{metrics.total}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.scheduled}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{metrics.completed}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Converted</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.converted}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{metrics.cancelled}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

