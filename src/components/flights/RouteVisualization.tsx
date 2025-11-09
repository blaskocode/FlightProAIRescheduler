'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Dynamically import map components to avoid SSR issues
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
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

// Import Leaflet CSS only on client
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
}

interface WaypointData {
  airportCode: string;
  latitude: number;
  longitude: number;
  order: number;
  weatherStatus?: 'SAFE' | 'MARGINAL' | 'UNSAFE';
  weatherData?: any;
  checkResult?: any;
}

interface RouteVisualizationProps {
  route?: string;
  flightId?: string;
  height?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export function RouteVisualization({
  route,
  flightId,
  height = '400px',
  showDetails = true,
  compact = false,
}: RouteVisualizationProps) {
  const [waypoints, setWaypoints] = useState<WaypointData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchRouteData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/weather/route-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route,
            flightId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch route data');
        }

        const data = await response.json();
        setRouteData(data);

        // Transform waypoints with weather data
        const waypointData: WaypointData[] = data.waypoints.map((wp: any, index: number) => {
          const check = data.checks[index];
          return {
            airportCode: wp.airportCode,
            latitude: wp.latitude,
            longitude: wp.longitude,
            order: wp.order,
            weatherStatus: check?.checkResult?.result || (check?.weather ? 'SAFE' : undefined),
            weatherData: check?.weather,
            checkResult: check?.checkResult,
          };
        });

        setWaypoints(waypointData);
      } catch (err: any) {
        setError(err.message || 'Failed to load route data');
        console.error('Error fetching route data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (route || flightId) {
      fetchRouteData();
    } else {
      setError('Route or flight ID is required');
      setLoading(false);
    }
  }, [route, flightId, mounted]);

  const getMarkerColor = (status?: string) => {
    switch (status) {
      case 'UNSAFE':
        return '#ef4444'; // red
      case 'MARGINAL':
        return '#f59e0b'; // yellow
      default:
        return '#10b981'; // green
    }
  };

  const createCustomIcon = (color: string, label: string) => {
    if (typeof window === 'undefined') return undefined;
    const L = require('leaflet');
    return L.divIcon({
      className: 'custom-route-marker',
      html: `
        <div style="
          background-color: ${color}; 
          width: 24px; 
          height: 24px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          color: white;
        ">${label}</div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const calculateDistance = () => {
    if (waypoints.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const wp1 = waypoints[i];
      const wp2 = waypoints[i + 1];
      
      // Haversine formula
      const R = 3440; // Earth radius in nautical miles
      const dLat = (wp2.latitude - wp1.latitude) * Math.PI / 180;
      const dLon = (wp2.longitude - wp1.longitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(wp1.latitude * Math.PI / 180) *
        Math.cos(wp2.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    
    return Math.round(totalDistance);
  };

  const estimateFlightTime = (distance: number) => {
    // Assume average speed of 120 knots for training aircraft
    const speed = 120; // knots
    const timeHours = distance / speed;
    const hours = Math.floor(timeHours);
    const minutes = Math.round((timeHours - hours) * 60);
    return { hours, minutes };
  };

  if (!mounted) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-red-600" style={{ height }}>
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (waypoints.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-gray-500" style={{ height }}>
            <p>No route data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const distance = calculateDistance();
  const flightTime = estimateFlightTime(distance);
  const routeString = routeData?.route || waypoints.map(wp => wp.airportCode).join('-');
  const polylinePositions = waypoints.map(wp => [wp.latitude, wp.longitude] as [number, number]);

  // Calculate map bounds
  const bounds = waypoints.length > 0
    ? waypoints.map(wp => [wp.latitude, wp.longitude] as [number, number])
    : [[30.1945, -97.6699] as [number, number]];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={compact ? 'text-lg' : ''}>Route Visualization</CardTitle>
          {!compact && (
            <Button
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              variant="outline"
              size="sm"
            >
              {viewMode === 'map' ? 'List View' : 'Map View'}
            </Button>
          )}
        </div>
        {showDetails && routeData && (
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">Route: {routeString}</Badge>
            <Badge variant={routeData.overallResult === 'UNSAFE' ? 'destructive' : routeData.overallResult === 'MARGINAL' ? 'default' : 'outline'}>
              {routeData.overallResult}
            </Badge>
            {distance > 0 && (
              <Badge variant="outline">{distance} NM</Badge>
            )}
            {flightTime.hours > 0 && (
              <Badge variant="outline">~{flightTime.hours}h {flightTime.minutes}m</Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {viewMode === 'map' ? (
          <div className="rounded-lg overflow-hidden border" style={{ height }}>
            <MapContainer
              center={waypoints[0] ? [waypoints[0].latitude, waypoints[0].longitude] : [30.1945, -97.6699]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              bounds={bounds}
              boundsOptions={{ padding: [20, 20] }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Route polyline */}
              {polylinePositions.length > 1 && (
                <Polyline
                  positions={polylinePositions}
                  color="#3b82f6"
                  weight={3}
                  opacity={0.7}
                />
              )}
              {/* Waypoint markers */}
              {waypoints.map((waypoint, index) => {
                const color = getMarkerColor(waypoint.weatherStatus);
                const label = index === 0 ? 'D' : index === waypoints.length - 1 ? 'A' : `${index}`;
                const icon = createCustomIcon(color, label);
                
                return (
                  <Marker
                    key={`${waypoint.airportCode}-${index}`}
                    position={[waypoint.latitude, waypoint.longitude]}
                    icon={icon}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-semibold text-lg mb-2">
                          {waypoint.airportCode}
                          {index === 0 && ' (Departure)'}
                          {index === waypoints.length - 1 && ' (Arrival)'}
                        </h3>
                        {waypoint.weatherStatus && (
                          <Badge
                            variant={
                              waypoint.weatherStatus === 'UNSAFE'
                                ? 'destructive'
                                : waypoint.weatherStatus === 'MARGINAL'
                                ? 'default'
                                : 'outline'
                            }
                            className="mb-2"
                          >
                            {waypoint.weatherStatus}
                          </Badge>
                        )}
                        {waypoint.weatherData && (
                          <div className="mt-2 text-xs space-y-1">
                            <p><strong>Wind:</strong> {waypoint.weatherData.windSpeed} kts @ {waypoint.weatherData.windDirection}°</p>
                            <p><strong>Visibility:</strong> {waypoint.weatherData.visibility} SM</p>
                            <p><strong>Ceiling:</strong> {waypoint.weatherData.ceiling ? `${waypoint.weatherData.ceiling} ft` : 'Unlimited'}</p>
                            {waypoint.weatherData.temperature && (
                              <p><strong>Temp:</strong> {waypoint.weatherData.temperature}°F</p>
                            )}
                          </div>
                        )}
                        {waypoint.checkResult?.reasons && waypoint.checkResult.reasons.length > 0 && (
                          <div className="mt-2 text-xs">
                            <p className="font-medium">Issues:</p>
                            <ul className="list-disc list-inside text-gray-700">
                              {waypoint.checkResult.reasons.map((reason: string, idx: number) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {waypoints.map((waypoint, index) => (
              <div
                key={`${waypoint.airportCode}-${index}`}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {waypoint.airportCode}
                      {index === 0 && ' (Departure)'}
                      {index === waypoints.length - 1 && ' (Arrival)'}
                    </h3>
                    <p className="text-xs text-gray-500">Waypoint {index + 1} of {waypoints.length}</p>
                  </div>
                  {waypoint.weatherStatus && (
                    <Badge
                      variant={
                        waypoint.weatherStatus === 'UNSAFE'
                          ? 'destructive'
                          : waypoint.weatherStatus === 'MARGINAL'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      {waypoint.weatherStatus}
                    </Badge>
                  )}
                </div>
                {waypoint.weatherData && (
                  <div className="mt-2 text-sm space-y-1">
                    <p><strong>Wind:</strong> {waypoint.weatherData.windSpeed} kts @ {waypoint.weatherData.windDirection}°</p>
                    <p><strong>Visibility:</strong> {waypoint.weatherData.visibility} SM</p>
                    <p><strong>Ceiling:</strong> {waypoint.weatherData.ceiling ? `${waypoint.weatherData.ceiling} ft` : 'Unlimited'}</p>
                    {waypoint.weatherData.temperature && (
                      <p><strong>Temp:</strong> {waypoint.weatherData.temperature}°F</p>
                    )}
                  </div>
                )}
                {waypoint.checkResult?.reasons && waypoint.checkResult.reasons.length > 0 && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium">Issues:</p>
                    <ul className="list-disc list-inside text-gray-700">
                      {waypoint.checkResult.reasons.map((reason: string, idx: number) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

