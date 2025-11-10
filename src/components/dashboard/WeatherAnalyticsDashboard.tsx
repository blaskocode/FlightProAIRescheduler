'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MonthlyWeatherPattern,
  AirportWeatherPattern,
  CancellationTrend,
  OptimalTrainingWindow,
  WeatherInsight,
} from '@/lib/services/weather-analytics-service';

interface WeatherAnalyticsDashboardProps {
  schoolId: string;
}

export function WeatherAnalyticsDashboard({ schoolId }: WeatherAnalyticsDashboardProps) {
  const [monthlyPatterns, setMonthlyPatterns] = useState<MonthlyWeatherPattern[]>([]);
  const [airportPatterns, setAirportPatterns] = useState<AirportWeatherPattern[]>([]);
  const [cancellationTrends, setCancellationTrends] = useState<CancellationTrend[]>([]);
  const [optimalWindows, setOptimalWindows] = useState<OptimalTrainingWindow[]>([]);
  const [insights, setInsights] = useState<WeatherInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'30' | '90' | '365'>('365');

  useEffect(() => {
    if (schoolId) {
      fetchAnalytics();
    }
  }, [schoolId, dateRange]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      const [monthlyRes, airportRes, trendsRes, windowsRes, insightsRes] = await Promise.all([
        fetch(`/api/weather/analytics/monthly-patterns?schoolId=${schoolId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`).catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch(`/api/weather/analytics/airport-patterns?schoolId=${schoolId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`).catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch(`/api/weather/analytics/cancellation-trends?schoolId=${schoolId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&groupBy=day`).catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch(`/api/weather/analytics/optimal-windows?schoolId=${schoolId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`).catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch(`/api/weather/analytics/insights?schoolId=${schoolId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`).catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
      ]);

      if (monthlyRes.ok) {
        const data = await monthlyRes.json();
        setMonthlyPatterns(data);
      }

      if (airportRes.ok) {
        const data = await airportRes.json();
        setAirportPatterns(data);
      }

      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setCancellationTrends(data);
      }

      if (windowsRes.ok) {
        const data = await windowsRes.json();
        setOptimalWindows(data);
      }

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setInsights(data);
      }
      
      // Set loading to false after all requests complete (even if some failed)
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
      setLoading(false);
    }
  }
  
  // Don't render if no schoolId
  if (!schoolId) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <p className="text-gray-500">Weather analytics require a school association.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading weather analytics...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Weather Analytics</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as '30' | '90' | '365')}
          className="rounded-md border border-gray-300 px-3 py-2 w-full sm:w-auto text-sm sm:text-base"
        >
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Predictive Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{insight.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      <p className="text-sm text-blue-600 mt-2">{insight.recommendation}</p>
                    </div>
                    <Badge variant="outline">{insight.confidence.toFixed(0)}% confidence</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimal Training Windows */}
      {optimalWindows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optimal Training Windows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {optimalWindows.map((window) => (
                <div
                  key={window.month}
                  className={`p-4 border rounded-lg ${
                    window.recommendation === 'EXCELLENT'
                      ? 'bg-green-50 border-green-200'
                      : window.recommendation === 'GOOD'
                      ? 'bg-blue-50 border-blue-200'
                      : window.recommendation === 'FAIR'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{window.monthName}</h3>
                    <Badge
                      variant={
                        window.recommendation === 'EXCELLENT'
                          ? 'default'
                          : window.recommendation === 'GOOD'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {window.recommendation}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{window.reasoning}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Safe Rate: {window.avgSafeRate.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Patterns */}
      {monthlyPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Weather Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Month</th>
                    <th className="text-right p-2">Total Checks</th>
                    <th className="text-right p-2">Safe</th>
                    <th className="text-right p-2">Marginal</th>
                    <th className="text-right p-2">Unsafe</th>
                    <th className="text-right p-2">Avg Visibility</th>
                    <th className="text-right p-2">Avg Ceiling</th>
                    <th className="text-right p-2">Cancellation Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyPatterns
                    .filter(p => p.totalChecks > 0)
                    .map((pattern) => (
                      <tr key={pattern.month} className="border-b">
                        <td className="p-2">{pattern.monthName}</td>
                        <td className="text-right p-2">{pattern.totalChecks}</td>
                        <td className="text-right p-2 text-green-600">{pattern.safeCount}</td>
                        <td className="text-right p-2 text-yellow-600">{pattern.marginalCount}</td>
                        <td className="text-right p-2 text-red-600">{pattern.unsafeCount}</td>
                        <td className="text-right p-2">{pattern.avgVisibility.toFixed(1)} SM</td>
                        <td className="text-right p-2">{pattern.avgCeiling.toFixed(0)} ft</td>
                        <td className="text-right p-2">{pattern.cancellationRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Airport Patterns */}
      {airportPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Airport-Specific Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {airportPatterns.slice(0, 5).map((pattern) => (
                <div key={pattern.airportCode} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{pattern.airportCode}</h3>
                    <span className="text-sm text-gray-600">{pattern.totalChecks} checks</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Safe Rate:</span>{' '}
                      <span className="font-semibold text-green-600">
                        {pattern.safeRate.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Visibility:</span>{' '}
                      <span className="font-semibold">{pattern.avgVisibility.toFixed(1)} SM</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Ceiling:</span>{' '}
                      <span className="font-semibold">{pattern.avgCeiling.toFixed(0)} ft</span>
                    </div>
                  </div>
                  {pattern.commonConditions.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-600">Common Conditions: </span>
                      <span className="text-xs">
                        {pattern.commonConditions.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancellation Trends */}
      {cancellationTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cancellation Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cancellationTrends.slice(-10).map((trend) => (
                <div key={trend.date} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{new Date(trend.date).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">
                      {trend.weatherCancellations} / {trend.totalFlights} cancelled
                    </span>
                    <span className="font-semibold">
                      {trend.cancellationRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

