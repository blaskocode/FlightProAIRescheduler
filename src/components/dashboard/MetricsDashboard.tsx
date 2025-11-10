'use client';

import React, { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MetricsSummary {
  weatherImpact: {
    totalFlights: number;
    weatherCancellations: number;
    cancellationRate: number;
    successfulReschedules: number;
    rescheduleRate: number;
    avgRescheduleTime: number;
    revenueProtected: number;
    revenueLost: number;
  };
  resourceUtilization: {
    aircraft: Array<{
      tailNumber: string;
      scheduledHours: number;
      flownHours: number;
      utilizationRate: number;
      maintenanceHours: number;
    }>;
    instructors: Array<{
      name: string;
      scheduledHours: number;
      actualHours: number;
      studentCount: number;
      efficiency: number;
    }>;
  };
  studentProgress: {
    onTrack: number;
    delayed: number;
    atRisk: number;
    avgCompletionRate: number;
  };
  period: {
    startDate: string;
    endDate: string;
  };
}

export function MetricsDashboard({ schoolId }: { schoolId?: string }) {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'30' | '60' | '90' | 'custom'>('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchMetrics = async () => {
    if (!schoolId) {
      setError('School ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let startDate: string;
      let endDate: string;

      if (dateRange === 'custom') {
        startDate = customStart || format(subDays(new Date(), 30), 'yyyy-MM-dd');
        endDate = customEnd || format(new Date(), 'yyyy-MM-dd');
      } else {
        const days = parseInt(dateRange);
        startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
        endDate = format(new Date(), 'yyyy-MM-dd');
      }

      const response = await fetch(
        `/api/analytics/metrics?schoolId=${schoolId}&startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [schoolId, dateRange]);

  if (loading) {
    return <div className="p-4">Loading metrics...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!metrics) {
    return <div className="p-4 text-gray-500">No metrics available</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {dateRange === 'custom' && (
            <>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                placeholder="Start Date"
                className="w-full sm:w-auto"
              />
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                placeholder="End Date"
                className="w-full sm:w-auto"
              />
            </>
          )}
          <Button onClick={fetchMetrics} className="w-full sm:w-auto">Refresh</Button>
        </div>
      </div>

      {/* Weather Impact Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="p-3 sm:p-4 border rounded-lg bg-white">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Flights</h3>
          <p className="text-xl sm:text-2xl font-bold mt-1">{metrics.weatherImpact.totalFlights}</p>
        </div>
        <div className="p-3 sm:p-4 border rounded-lg bg-white">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Weather Cancellations</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{metrics.weatherImpact.weatherCancellations}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {metrics.weatherImpact.cancellationRate.toFixed(1)}% cancellation rate
          </p>
        </div>
        <div className="p-3 sm:p-4 border rounded-lg bg-white">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Successful Reschedules</h3>
          <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{metrics.weatherImpact.successfulReschedules}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {metrics.weatherImpact.rescheduleRate.toFixed(1)}% reschedule rate
          </p>
        </div>
        <div className="p-3 sm:p-4 border rounded-lg bg-white">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Avg Reschedule Time</h3>
          <p className="text-xl sm:text-2xl font-bold mt-1">{metrics.weatherImpact.avgRescheduleTime.toFixed(1)} hours</p>
        </div>
      </div>

      {/* Revenue Impact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
        <div className="p-3 sm:p-4 border rounded-lg bg-green-50">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700">Revenue Protected</h3>
          <p className="text-xl sm:text-2xl font-bold text-green-700 mt-1">
            ${metrics.weatherImpact.revenueProtected.toLocaleString()}
          </p>
        </div>
        <div className="p-3 sm:p-4 border rounded-lg bg-red-50">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700">Revenue Lost</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-700 mt-1">
            ${metrics.weatherImpact.revenueLost.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Aircraft Utilization */}
      <div className="p-3 sm:p-4 border rounded-lg bg-white">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Aircraft Utilization</h3>
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-3 sm:px-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Aircraft</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Flown</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Maintenance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.resourceUtilization.aircraft.map((ac) => (
                  <tr key={ac.tailNumber}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">{ac.tailNumber}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{ac.scheduledHours}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{ac.flownHours}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ac.utilizationRate >= 80 ? 'bg-green-100 text-green-800' :
                        ac.utilizationRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ac.utilizationRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{ac.maintenanceHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Instructor Efficiency */}
      <div className="p-3 sm:p-4 border rounded-lg bg-white">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Instructor Efficiency</h3>
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-3 sm:px-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.resourceUtilization.instructors.map((inst) => (
                  <tr key={inst.name}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">{inst.name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{inst.scheduledHours}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{inst.actualHours}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        inst.efficiency >= 90 ? 'bg-green-100 text-green-800' :
                        inst.efficiency >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {inst.efficiency.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{inst.studentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Student Progress */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="p-3 sm:p-4 border rounded-lg bg-white">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">On Track</h3>
          <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{metrics.studentProgress.onTrack}</p>
        </div>
        <div className="p-3 sm:p-4 border rounded-lg bg-white">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Delayed</h3>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-1">{metrics.studentProgress.delayed}</p>
        </div>
        <div className="p-3 sm:p-4 border rounded-lg bg-white">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">At Risk</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{metrics.studentProgress.atRisk}</p>
        </div>
        <div className="p-3 sm:p-4 border rounded-lg bg-white">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Avg Completion Rate</h3>
          <p className="text-xl sm:text-2xl font-bold mt-1">{metrics.studentProgress.avgCompletionRate.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

