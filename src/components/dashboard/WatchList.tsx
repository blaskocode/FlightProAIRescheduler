'use client';

import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';

interface WatchListFlight {
  id: string;
  scheduledStart: string;
  student: {
    firstName: string;
    lastName: string;
  };
  aircraft: {
    tailNumber: string;
  };
  weatherChecks: Array<{
    confidence: number;
    result: string;
  }>;
}

export function WatchList() {
  const [flights, setFlights] = useState<WatchListFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWatchList() {
      try {
        const response = await fetch('/api/weather/watch-list');
        if (!response.ok) {
          throw new Error('Failed to fetch watch list');
        }
        const data = await response.json();
        setFlights(data.flights || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchWatchList();
  }, []);

  if (loading) {
    return <div className="p-4">Loading watch list...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (flights.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-white">
        <h3 className="text-lg font-semibold mb-2">Weather Watch List</h3>
        <p className="text-gray-500">No flights on watch list. All flights have high confidence forecasts.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">Weather Watch List</h3>
      <p className="text-sm text-gray-600 mb-4">
        Flights with medium confidence forecasts (60-89%) that need monitoring
      </p>
      <div className="space-y-3">
        {flights.map((flight) => {
          const latestCheck = flight.weatherChecks[0];
          return (
            <div key={flight.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {format(parseISO(flight.scheduledStart), 'MMM d, yyyy HH:mm')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {flight.student.firstName} {flight.student.lastName} • {flight.aircraft.tailNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-yellow-800">
                    {latestCheck?.confidence || 0}% Confidence
                  </span>
                  <p className="text-xs text-yellow-700">
                    {latestCheck?.result || 'UNKNOWN'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

