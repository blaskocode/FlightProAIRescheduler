'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ModelPerformance {
  totalPredictions: number;
  accuratePredictions: number;
  accuracy: number;
  falsePositives: number;
  falseNegatives: number;
  truePositives: number;
  trueNegatives: number;
  precision: number;
  recall: number;
  threshold: number;
}

export function ModelPerformanceDashboard({ schoolId }: { schoolId: string }) {
  const [performance, setPerformance] = useState<ModelPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('90');

  useEffect(() => {
    fetchPerformance();
  }, [schoolId, dateRange]);

  async function fetchPerformance() {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      const response = await fetch(
        `/api/predictions/performance?schoolId=${schoolId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setPerformance(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch model performance');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch model performance');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading model performance...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!performance || performance.totalPredictions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No prediction data available for this period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Performance Metrics</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 180 days</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Total Predictions</p>
              <p className="text-2xl font-bold">{performance.totalPredictions}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Accuracy</p>
              <p className="text-2xl font-bold text-blue-600">
                {performance.accuracy.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Precision</p>
              <p className="text-2xl font-bold text-green-600">
                {performance.precision.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">Recall</p>
              <p className="text-2xl font-bold text-purple-600">
                {performance.recall.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">True Positives</p>
              <p className="text-xl font-bold text-green-700">
                {performance.truePositives}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">True Negatives</p>
              <p className="text-xl font-bold text-blue-700">
                {performance.trueNegatives}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">False Positives</p>
              <p className="text-xl font-bold text-yellow-700">
                {performance.falsePositives}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">False Negatives</p>
              <p className="text-xl font-bold text-red-700">
                {performance.falseNegatives}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Prediction Threshold</p>
            <p className="text-lg font-semibold">
              {performance.threshold}% probability
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Flights with {performance.threshold}%+ cancellation probability are considered "high risk"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

