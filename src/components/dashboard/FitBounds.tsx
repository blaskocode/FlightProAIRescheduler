'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface Airport {
  latitude: number;
  longitude: number;
}

interface FitBoundsProps {
  airports: Airport[];
}

export function FitBounds({ airports }: FitBoundsProps) {
  const map = useMap();
  
  useEffect(() => {
    if (airports.length > 0 && map && typeof window !== 'undefined') {
      const L = require('leaflet');
      const bounds = L.latLngBounds(
        airports.map((airport) => [airport.latitude, airport.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [airports, map]);
  
  return null;
}

