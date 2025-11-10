'use client';

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface WaypointData {
  airportCode: string;
  latitude: number;
  longitude: number;
  order: number;
  weatherStatus?: 'SAFE' | 'MARGINAL' | 'UNSAFE';
  weatherData?: any;
  checkResult?: any;
}

interface MapboxRouteMapProps {
  waypoints: WaypointData[];
  height?: string;
}

export function MapboxRouteMap({ waypoints, height = '400px' }: MapboxRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Helper to extract value from weather data fields
  const getWeatherValue = (field: any): number | string => {
    if (field === null || field === undefined) return '';
    if (typeof field === 'object' && 'value' in field) {
      return field.value;
    }
    return field;
  };

  // Get marker color based on weather status
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

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZmxpZ2h0cHJvIiwiYSI6ImNtMzd0ZHo4MzBmZWkya3M4Z2g4dXI5bGcifQ.placeholder';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: waypoints.length > 0 
        ? [waypoints[0].longitude, waypoints[0].latitude]
        : [-97.6699, 30.1945], // Default to Austin
      zoom: 6,
    });

    // Wait for map to load before adding sources/layers
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded || waypoints.length === 0) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Remove existing route line if it exists
    if (map.current.getLayer('route-line')) {
      map.current.removeLayer('route-line');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }

    // Create GeoJSON line for the route
    const routeCoordinates = waypoints.map(wp => [wp.longitude, wp.latitude]);
    
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates,
        },
      },
    });

    // Add the route line
    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 3,
        'line-opacity': 0.7,
      },
    });

    // Add markers for each waypoint
    waypoints.forEach((waypoint, index) => {
      const color = getMarkerColor(waypoint.weatherStatus);
      const label = index === 0 ? 'D' : index === waypoints.length - 1 ? 'A' : `${index}`;

      const el = document.createElement('div');
      el.className = 'route-marker';
      el.style.backgroundColor = color;
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '12px';
      el.style.fontWeight = 'bold';
      el.style.color = 'white';
      el.style.cursor = 'pointer';
      el.textContent = label;

      // Build popup content
      const weatherInfo = waypoint.weatherData ? `
        <div class="mt-2 text-xs space-y-1">
          <p><strong>Wind:</strong> ${getWeatherValue(waypoint.weatherData.windSpeed)} kts @ ${getWeatherValue(waypoint.weatherData.windDirection)}°</p>
          <p><strong>Visibility:</strong> ${getWeatherValue(waypoint.weatherData.visibility)} SM</p>
          <p><strong>Ceiling:</strong> ${waypoint.weatherData.ceiling ? `${getWeatherValue(waypoint.weatherData.ceiling)} ft` : 'Unlimited'}</p>
          ${waypoint.weatherData.temperature ? `<p><strong>Temp:</strong> ${getWeatherValue(waypoint.weatherData.temperature)}°F</p>` : ''}
        </div>
      ` : '';

      const issuesInfo = waypoint.checkResult?.reasons && waypoint.checkResult.reasons.length > 0 ? `
        <div class="mt-2 text-xs">
          <p class="font-medium">Issues:</p>
          <ul class="list-disc list-inside text-gray-700">
            ${waypoint.checkResult.reasons.map((reason: string) => `<li>${reason}</li>`).join('')}
          </ul>
        </div>
      ` : '';

      const statusBadge = waypoint.weatherStatus ? `
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          waypoint.weatherStatus === 'UNSAFE'
            ? 'bg-red-100 text-red-800'
            : waypoint.weatherStatus === 'MARGINAL'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
        } mb-2">
          ${waypoint.weatherStatus}
        </span>
      ` : '';

      const popupContent = `
        <div class="p-2 min-w-[200px]">
          <h3 class="font-semibold text-lg mb-2">
            ${waypoint.airportCode}
            ${index === 0 ? ' (Departure)' : ''}
            ${index === waypoints.length - 1 ? ' (Arrival)' : ''}
          </h3>
          ${statusBadge}
          ${weatherInfo}
          ${issuesInfo}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

      if (map.current) {
        const marker = new mapboxgl.Marker(el)
          .setLngLat([waypoint.longitude, waypoint.latitude])
          .setPopup(popup)
          .addTo(map.current);

        markers.current.push(marker);
      }
    });

    // Fit map to show entire route
    if (waypoints.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      waypoints.forEach(waypoint => {
        bounds.extend([waypoint.longitude, waypoint.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  }, [waypoints, mapLoaded]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        height: height,
        width: '100%',
        borderRadius: '0.5rem',
      }} 
    />
  );
}

