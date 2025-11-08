'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PredictionResult {
  cancellationProbability: number;
  confidence: number;
  factors: Array<{
    factor: string;
    impact: number;
    explanation: string;
  }>;
  recommendation: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'VERY_HIGH_RISK';
}

interface CancellationPredictionCardProps {
  flightId: string;
}

export function CancellationPredictionCard({ flightId }: CancellationPredictionCardProps) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrediction();
  }, [flightId]);

  async function fetchPrediction() {
    try {
      setLoading(true);
      const response = await fetch('/api/predictions/cancellation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flightId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate prediction');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cancellation Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Generating prediction...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cancellation Prediction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchPrediction} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return null;
  }

  const getRiskColor = (recommendation: string) => {
    switch (recommendation) {
      case 'LOW_RISK':
        return 'bg-green-100 text-green-800';
      case 'MODERATE_RISK':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH_RISK':
        return 'bg-orange-100 text-orange-800';
      case 'VERY_HIGH_RISK':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cancellation Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">
              {prediction.cancellationProbability.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">Cancellation Probability</p>
          </div>
          <Badge className={getRiskColor(prediction.recommendation)}>
            {prediction.recommendation.replace('_', ' ')}
          </Badge>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-gray-600 mb-2">
            Confidence: {prediction.confidence.toFixed(0)}%
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Key Factors:</p>
          {prediction.factors.slice(0, 3).map((factor, idx) => (
            <div key={idx} className="text-xs p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{factor.factor}</span>
                <span className={factor.impact > 0 ? 'text-red-600' : 'text-green-600'}>
                  {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)}%
                </span>
              </div>
              <p className="text-gray-600">{factor.explanation}</p>
            </div>
          ))}
        </div>

        <Button onClick={fetchPrediction} variant="outline" size="sm" className="w-full">
          Refresh Prediction
        </Button>
      </CardContent>
    </Card>
  );
}

