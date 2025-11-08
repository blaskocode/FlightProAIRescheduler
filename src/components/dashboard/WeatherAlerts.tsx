'use client';

import { useEffect, useState } from 'react';

interface WeatherAlert {
  id: string;
  flightId: string;
  result: string;
  confidence: number;
  reasons: string[];
  flight: {
    scheduledStart: string;
    lessonTitle: string | null;
  };
}

export function WeatherAlerts() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await fetch('/api/weather/alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data);
        } else {
          console.error('Failed to fetch weather alerts');
        }
      } catch (error) {
        console.error('Error fetching weather alerts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  if (loading) {
    return <div className="p-4">Loading weather alerts...</div>;
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <h3 className="font-semibold mb-2">Weather Alerts</h3>
        <p className="text-sm text-gray-500">No active weather alerts</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="font-semibold mb-4">Active Weather Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-md p-3 ${
              alert.result === 'UNSAFE'
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">
                  {new Date(alert.flight.scheduledStart).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {alert.flight.lessonTitle}
                </p>
                <ul className="text-xs text-gray-700 mt-2 list-disc list-inside">
                  {alert.reasons.slice(0, 2).map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
              <span className="text-xs font-medium">
                {alert.confidence}% confidence
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

