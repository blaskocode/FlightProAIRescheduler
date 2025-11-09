'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

interface MapboxWeatherMapProps {
  airports: AirportWeather[];
  defaultCenter: [number, number];
  defaultZoom: number;
}

export function MapboxWeatherMap({ airports, defaultCenter, defaultZoom }: MapboxWeatherMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZmxpZ2h0cHJvIiwiYSI6ImNtMzd0ZHo4MzBmZWkya3M4Z2g4dXI5bGcifQ.placeholder';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: defaultZoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [defaultCenter, defaultZoom]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    if (airports.length === 0) return;

    // Add markers for each airport
    airports.forEach(airport => {
      const color = airport.status === 'unsafe' 
        ? '#ef4444' 
        : airport.status === 'marginal' 
        ? '#f59e0b' 
        : '#10b981';

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = color;
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      // Create popup content
      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${airport.airportCode}</h3>
          <div style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-bottom: 8px; background-color: ${
            airport.status === 'unsafe' ? '#fee2e2' : airport.status === 'marginal' ? '#fef3c7' : '#d1fae5'
          }; color: ${
            airport.status === 'unsafe' ? '#991b1b' : airport.status === 'marginal' ? '#92400e' : '#065f46'
          };">
            ${airport.status.toUpperCase()}
          </div>
          ${airport.alerts.length > 0 ? `
            <div style="margin-top: 8px;">
              <p style="font-size: 12px; font-weight: 500; margin-bottom: 4px;">Active Alerts (${airport.alerts.length}):</p>
              ${airport.alerts.map(alert => `
                <div style="font-size: 11px; border-left: 2px solid #d1d5db; padding-left: 8px; margin-bottom: 8px;">
                  <p style="font-weight: 500;">${new Date(alert.scheduledStart).toLocaleString()}</p>
                  <p style="color: #6b7280;">${alert.confidence}% confidence</p>
                  <ul style="list-style-type: disc; margin-left: 16px; margin-top: 4px; color: #374151;">
                    ${alert.reasons.slice(0, 2).map(reason => `<li>${reason}</li>`).join('')}
                    ${alert.reasons.length > 2 ? `<li style="color: #9ca3af;">+${alert.reasons.length - 2} more</li>` : ''}
                  </ul>
                </div>
              `).join('')}
            </div>
          ` : '<p style="font-size: 12px; color: #6b7280; margin-top: 8px;">No active alerts</p>'}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([airport.longitude, airport.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit bounds to show all airports
    if (airports.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      airports.forEach(airport => {
        bounds.extend([airport.longitude, airport.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  }, [airports]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        height: '100%', 
        width: '100%',
        borderRadius: '0.5rem',
      }} 
    />
  );
}

