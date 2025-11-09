'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapboxWeatherMap } from './MapboxWeatherMap';

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

interface WeatherMapDashboardProps {
  schoolId?: string;
}


export function WeatherMapDashboard({ schoolId }: WeatherMapDashboardProps) {
  const { user, authUser, loading: authLoading } = useAuth();
  const [airports, setAirports] = useState<AirportWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map'); // Default to map view
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchWeatherData = useCallback(async () => {
    if (!user || !authUser) return;
    
    try {
      setLoading(true);
      
      // Get auth token
      const token = await user.getIdToken();
      
      // Fetch weather alerts
      const alertsResponse = await fetch('/api/weather/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const alertsData = await alertsResponse.ok ? await alertsResponse.json() : [];
      console.log('[WeatherMap] Fetched alerts:', alertsData.length);

      // Fetch flights to get airport codes
      const flightsResponse = await fetch('/api/flights', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const flightsData = await flightsResponse.ok ? await flightsResponse.json() : [];

      // Group alerts by airport
      const airportMap = new Map<string, AirportWeather>();

      // Process alerts
      alertsData.forEach((alert: any) => {
        // Get airport code from alert's flight data
        const airportCode = alert.flight?.departureAirport;
        if (!airportCode) return;
        
        if (!airportMap.has(airportCode)) {
          airportMap.set(airportCode, {
            airportCode,
            latitude: 0, // Will be fetched
            longitude: 0, // Will be fetched
            status: alert.result === 'UNSAFE' ? 'unsafe' : 'marginal',
            alerts: [],
            lastUpdated: new Date().toISOString(),
          });
        }

        const airport = airportMap.get(airportCode)!;
        airport.alerts.push({
          id: alert.id,
          result: alert.result,
          confidence: alert.confidence,
          reasons: alert.reasons,
          flightId: alert.flightId,
          scheduledStart: alert.flight.scheduledStart,
        });

        // Update status to worst case
        if (alert.result === 'UNSAFE') {
          airport.status = 'unsafe';
        } else if (alert.result === 'MARGINAL' && airport.status === 'safe') {
          airport.status = 'marginal';
        }
      });

      // Add airports from flights (even without alerts)
      flightsData.forEach((flight: any) => {
        const airportCode = flight.departureAirport;
        if (!airportCode || airportMap.has(airportCode)) return;

        airportMap.set(airportCode, {
          airportCode,
          latitude: 0,
          longitude: 0,
          status: 'safe',
          alerts: [],
          lastUpdated: new Date().toISOString(),
        });
      });

      // Fetch coordinates for all airports
      const airportsArray = Array.from(airportMap.values());
      const coordinatesPromises = airportsArray.map(async (airport) => {
        try {
          const response = await fetch(`/api/airports/${airport.airportCode}/coordinates`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const coords = await response.json();
            return {
              ...airport,
              latitude: coords.latitude,
              longitude: coords.longitude,
            };
          }
        } catch (err) {
          console.error(`Error fetching coordinates for ${airport.airportCode}:`, err);
        }
        return airport;
      });

      const airportsWithCoords = await Promise.all(coordinatesPromises);
      
      // Filter out airports with invalid coordinates
      const validAirports = airportsWithCoords.filter(
        (airport) => airport.latitude !== 0 || airport.longitude !== 0
      );

      console.log('[WeatherMap] Valid airports:', validAirports.length);
      setAirports(validAirports);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authUser]);

  useEffect(() => {
    if (!mounted || !user || !authUser || authLoading) return;
    
    fetchWeatherData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [schoolId, mounted, user, authUser, authLoading, fetchWeatherData]);


  // Default center (Austin, TX) - Mapbox uses [longitude, latitude]
  const defaultCenter: [number, number] = [-97.6699, 30.1945];
  const defaultZoom = 6;

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading && airports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weather Map</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              variant="outline"
              size="sm"
            >
              {viewMode === 'map' ? 'List View' : 'Map View'}
            </Button>
            <Button onClick={fetchWeatherData} variant="outline" size="sm" disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
      </CardHeader>
      <CardContent>
        {viewMode === 'map' ? (
          <div className="h-96 w-full rounded-lg overflow-hidden border">
            {airports.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No airports to display on map</p>
              </div>
            ) : (
              <MapboxWeatherMap
                airports={airports}
                defaultCenter={defaultCenter}
                defaultZoom={defaultZoom}
              />
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {airports.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No airports to display</p>
            ) : (
              airports.map((airport) => (
                <div
                  key={airport.airportCode}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{airport.airportCode}</h3>
                    <Badge
                      variant={
                        airport.status === 'unsafe'
                          ? 'destructive'
                          : airport.status === 'marginal'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      {airport.status.toUpperCase()}
                    </Badge>
                  </div>
                  {airport.alerts.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Active Alerts ({airport.alerts.length}):</p>
                      {airport.alerts.map((alert) => (
                        <div key={alert.id} className="text-xs border-l-2 border-gray-300 pl-2">
                          <p className="font-medium">
                            {new Date(alert.scheduledStart).toLocaleString()}
                          </p>
                          <p className="text-gray-600">{alert.confidence}% confidence</p>
                          <ul className="list-disc list-inside mt-1 text-gray-700">
                            {alert.reasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No active alerts</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
