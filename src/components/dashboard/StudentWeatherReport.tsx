'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StudentWeatherReport {
  studentId: string;
  studentName: string;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalFlights: number;
    weatherCancellations: number;
    successfulReschedules: number;
    avgRescheduleTime: number;
    cancellationRate: number;
    rescheduleSuccessRate: number;
  };
  patterns: {
    bestDays: Array<{ day: string; successRate: number; flightCount: number }>;
    worstDays: Array<{ day: string; cancellationRate: number; flightCount: number }>;
    bestTimes: Array<{ hour: number; successRate: number; flightCount: number }>;
  };
  recommendations: string[];
}

interface StudentWeatherReportProps {
  studentId: string;
  studentName: string;
  onClose?: () => void;
}

export function StudentWeatherReport({ studentId, studentName, onClose }: StudentWeatherReportProps) {
  const [report, setReport] = useState<StudentWeatherReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'30' | '90' | '365'>('90');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      const response = await fetch(
        `/api/weather/analytics/student-report/${studentId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch weather report');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather report');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount and when dateRange changes
  useEffect(() => {
    fetchReport();
  }, [dateRange, studentId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather Report for {studentName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading weather report...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather Report for {studentName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchReport} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weather Report: {studentName}</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as '30' | '90' | '365');
                fetchReport();
              }}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 border rounded-lg">
            <p className="text-xs text-gray-600">Total Flights</p>
            <p className="text-xl font-bold">{report.summary.totalFlights}</p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="text-xs text-gray-600">Weather Cancellations</p>
            <p className="text-xl font-bold text-red-600">{report.summary.weatherCancellations}</p>
            <p className="text-xs text-gray-500">{report.summary.cancellationRate.toFixed(1)}%</p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="text-xs text-gray-600">Successful Reschedules</p>
            <p className="text-xl font-bold text-green-600">{report.summary.successfulReschedules}</p>
            <p className="text-xs text-gray-500">{report.summary.rescheduleSuccessRate.toFixed(1)}%</p>
          </div>
          <div className="p-3 border rounded-lg">
            <p className="text-xs text-gray-600">Avg Reschedule Time</p>
            <p className="text-xl font-bold">{report.summary.avgRescheduleTime.toFixed(1)} hours</p>
          </div>
        </div>

        {/* Patterns */}
        {report.patterns.bestDays.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Best Days for Flying</h3>
            <div className="flex flex-wrap gap-2">
              {report.patterns.bestDays.map((day, idx) => (
                <Badge key={idx} variant="outline" className="bg-green-50">
                  {day.day}: {day.successRate.toFixed(0)}% ({day.flightCount} flights)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {report.patterns.worstDays.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Days with Most Cancellations</h3>
            <div className="flex flex-wrap gap-2">
              {report.patterns.worstDays.map((day, idx) => (
                <Badge key={idx} variant="outline" className="bg-red-50">
                  {day.day}: {day.cancellationRate.toFixed(0)}% ({day.flightCount} flights)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {report.patterns.bestTimes.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Best Times of Day</h3>
            <div className="flex flex-wrap gap-2">
              {report.patterns.bestTimes.map((time, idx) => (
                <Badge key={idx} variant="outline" className="bg-blue-50">
                  {time.hour}:00 - {time.successRate.toFixed(0)}% ({time.flightCount} flights)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Recommendations</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {report.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

