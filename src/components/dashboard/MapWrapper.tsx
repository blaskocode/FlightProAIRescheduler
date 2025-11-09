'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { FitBounds } from './FitBounds';
import { Badge } from '@/components/ui/badge';

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

interface MapWrapperProps {
  airports: AirportWeather[];
  defaultCenter: [number, number];
  defaultZoom: number;
}

export function MapWrapper({ airports, defaultCenter, defaultZoom }: MapWrapperProps) {
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

