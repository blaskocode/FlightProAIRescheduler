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
    return (
      <div className="card-sky p-4">
        <div className="flex items-center gap-2 text-sky-600">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading weather alerts...
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="card-elevated p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">☁️</span>
          <h3 className="font-bold text-sky-800">Weather Alerts</h3>
        </div>
        <p className="text-sm text-sky-600">No active weather alerts - clear skies! ✈️</p>
      </div>
    );
  }

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⛈️</span>
        <h3 className="font-bold text-sky-800">Active Weather Alerts</h3>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-lg p-4 border-2 ${
              alert.result === 'UNSAFE'
                ? 'bg-aviation-red-50 border-aviation-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{alert.result === 'UNSAFE' ? '⚠️' : '🌦️'}</span>
                  <p className="font-semibold text-sm text-sky-900">
                    {new Date(alert.flight.scheduledStart).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-xs text-sky-700 font-medium mb-2">
                  {alert.flight.lessonTitle || 'Flight Lesson'}
                </p>
                <ul className="text-xs text-sky-700 mt-2 space-y-1">
                  {alert.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-sky-500">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/80 text-sky-700">
                  {alert.confidence}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

