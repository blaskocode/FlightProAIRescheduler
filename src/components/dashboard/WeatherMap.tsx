'use client';

import { useState, useEffect } from 'react';
import { LeafletMap } from './LeafletMap';

// Import Leaflet CSS only on client
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
}

interface AirportWeather {
  airportCode: string;
  latitude: number;
  longitude: number;
  status: 'safe' | 'marginal' | 'unsafe';
  alerts: Array<{
    id: string;
    result: string;
    confidence: number;
    reasons: string[];
    flightId: string;
    scheduledStart: string;
  }>;
  lastUpdated: string;
}

interface WeatherMapProps {
  airports: AirportWeather[];
  defaultCenter: [number, number];
  defaultZoom: number;
}

export function WeatherMap({ airports, defaultCenter, defaultZoom }: WeatherMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading map...
      </div>
    );
  }

  return (
    <LeafletMap
      airports={airports}
      defaultCenter={defaultCenter}
      defaultZoom={defaultZoom}
    />
  );
}

