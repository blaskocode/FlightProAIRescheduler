'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';

// Import Leaflet CSS only on client
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
  // Fix for Leaflet default marker icon path issue
  const L = require('leaflet');
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Dynamically import FitBounds to avoid SSR issues with useMap hook
const FitBounds = dynamic(
  () => import('./FitBounds').then((mod) => ({ default: mod.FitBounds })),
  { ssr: false }
);

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

interface LeafletMapProps {
  airports: AirportWeather[];
  defaultCenter: [number, number];
  defaultZoom: number;
}

export function LeafletMap({ airports, defaultCenter, defaultZoom }: LeafletMapProps) {
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'unsafe':
        return '#ef4444'; // red
      case 'marginal':
        return '#f59e0b'; // yellow
      default:
        return '#10b981'; // green
    }
  };

  const createCustomIcon = (color: string) => {
    if (typeof window === 'undefined') return undefined;
    const L = require('leaflet');
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  return (
    <MapContainer
      center={airports.length > 0 ? [airports[0].latitude, airports[0].longitude] : defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {airports.length > 0 && <FitBounds airports={airports} />}
      {airports.map((airport) => {
        const icon = createCustomIcon(getMarkerColor(airport.status));
        if (!icon) return null;
        return (
          <Marker
            key={airport.airportCode}
            position={[airport.latitude, airport.longitude]}
            icon={icon}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-lg mb-2">{airport.airportCode}</h3>
                <Badge
                  variant={
                    airport.status === 'unsafe'
                      ? 'destructive'
                      : airport.status === 'marginal'
                      ? 'default'
                      : 'outline'
                  }
                  className="mb-2"
                >
                  {airport.status.toUpperCase()}
                </Badge>
                {airport.alerts.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-medium">Active Alerts ({airport.alerts.length}):</p>
                    {airport.alerts.map((alert) => (
                      <div key={alert.id} className="text-xs border-l-2 border-gray-300 pl-2">
                        <p className="font-medium">
                          {new Date(alert.scheduledStart).toLocaleString()}
                        </p>
                        <p className="text-gray-600">{alert.confidence}% confidence</p>
                        <ul className="list-disc list-inside mt-1 text-gray-700">
                          {alert.reasons.slice(0, 2).map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                          {alert.reasons.length > 2 && (
                            <li className="text-gray-500">+{alert.reasons.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">No active alerts</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

